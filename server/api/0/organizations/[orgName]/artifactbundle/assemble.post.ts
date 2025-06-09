// POST https://sentry.io/api/0/organizations/anbraten/artifactbundle/assemble/
// json body: {"checksum":"f17c0446265886fe911e928a413541d0da578014","chunks":["f17c0446265886fe911e928a413541d0da578014"],"projects":["javascript-vue"],"version":"1.2.3"}
// body: {"state":"not_found","missingChunks":["2f5151e691c5f43d7c7a09f4d85bedca40db78ff"]}
// body: {"state":"created","missingChunks":[]}
// body: {"state":"ok","detail":null,"missingChunks":[]}

import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { createGunzip } from 'zlib';
import { pipeline } from 'node:stream/promises';
import { PassThrough } from 'node:stream';
import yauzl, { Entry } from 'yauzl';
import { ArtifactBundleFile, artifactBundleFilesTable } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const project = await requireProjectByToken(event);

  // https://github.com/getsentry/sentry/blob/8df7543848b4/src/sentry/api/endpoints/organization_artifactbundle_assemble.py#L24
  const body = await readBody<{
    checksum: string;
    chunks: string[];
    projects: string[];
    version?: string;
    dist?: string;
  }>(event);

  const s3 = await getS3Client();
  const config = useRuntimeConfig();

  const s3Prefix = `uploads/${project.id}/`;

  const uploads = await s3.send(
    new ListObjectsV2Command({
      Bucket: config.s3.bucket,
      Prefix: s3Prefix,
    }),
  );

  const chunks = uploads.Contents?.map((i) => i.Key?.replace(s3Prefix, '') ?? '') ?? [];
  const missingChunks = body.chunks.filter((chunk) => !chunks.includes(chunk));

  console.log('POST /api/0/organizations/anbraten/artifactbundle/assemble', {
    body,
    chunks,
    missingChunks,
  });

  if (missingChunks.length > 0) {
    return {
      state: 'not_found',
      missingChunks,
    };
  }

  if (chunks.length > 0) {
    const db = await useDb(event);
    const assembler = new ArtifactBundleAssembler(s3, config.s3.bucket, db);
    await assembler.assembleArtifactBundleStream(project.id.toString(), body.checksum, chunks);
  }

  return {
    state: 'created',
    missingChunks: [],
  };
});

class ArtifactBundleAssembler {
  s3Client: S3Client;
  db: ReturnType<typeof useDb>;
  bucketName: string;

  constructor(s3Client: S3Client, bucketName: string, db: ReturnType<typeof useDb>) {
    this.s3Client = s3Client;
    this.bucketName = bucketName;
    this.db = db;
  }

  /**
   * Creates a transform stream that decompresses gzip data
   */
  private createDecompressionStream() {
    return createGunzip();
  }

  /**
   * Fetches a chunk from S3 and returns a readable stream
   */
  private async getChunkStream(chunkKey: string): Promise<Readable> {
    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: chunkKey,
        }),
      );

      if (!response.Body) {
        throw new Error(`Chunk ${chunkKey} not found or empty`);
      }

      // Convert the S3 body to a Node.js readable stream
      return Readable.from(response.Body as any);
    } catch (error) {
      throw new Error(`Failed to fetch chunk ${chunkKey}: ${(error as Error).message}`);
    }
  }

  /**
   * Processes a single chunk: fetch from S3, decompress, and write to output stream
   */
  private async processChunk(chunkKey: string, outputStream: PassThrough): Promise<void> {
    try {
      const chunkStream = await this.getChunkStream(chunkKey);
      const decompressStream = this.createDecompressionStream();

      // Pipeline: S3 stream -> decompress -> output stream
      await pipeline(
        chunkStream,
        decompressStream,
        outputStream,
        { end: false }, // Don't end the output stream after this chunk
      );
    } catch (error) {
      console.error(`Error processing chunk ${chunkKey}:`, error);
      outputStream.destroy(error as Error);
      throw error;
    }
  }

  /**
   * Assembles artifact bundle from chunks using streams
   */
  async assembleArtifactBundleStream(projectId: string, checksum: string, chunks: string[]): Promise<void> {
    if (!chunks || chunks.length === 0) {
      throw new Error('No chunks provided for assembly');
    }

    const assemblyStream = new PassThrough();

    // Process chunks sequentially to maintain order and control memory usage
    const processChunks = async () => {
      try {
        for await (const chunk of chunks) {
          const chunkKey = `uploads/${projectId}/${chunk}`;
          await this.processChunk(chunkKey, assemblyStream);
        }

        // Signal that we're done writing to the stream
        assemblyStream.end();
      } catch (error) {
        console.error('Error during chunk processing:', error);
        assemblyStream.destroy(error as Error);
        throw error;
      }
    };

    // Start processing chunks and uploading concurrently
    const [_, zipBuffer] = await Promise.all([processChunks(), streamToBuffer(assemblyStream)]);

    const getS3Key = (fileName: string) => `projects/${projectId}/artifact_bundles/${checksum}/${fileName}`;

    const zip = await Zip.fromBuffer(zipBuffer);
    for await (const entry of zip) {
      if (entry && entry.fileName === 'manifest.json') {
        const stream = await zip.openReadStream(entry);
        const manifestBuffer = await streamToBuffer(stream);

        let manifest: {
          files: Record<
            string,
            {
              type: 'source_map' | 'minified_source';
              url: string;
              headers: Record<string, string>;
            }
          >;
          debug_id: string;
          org: string;
          project: string;
          release: string;
        };

        try {
          manifest = JSON.parse(manifestBuffer.toString('utf-8'));
        } catch (e) {
          throw new Error('Failed to parse manifest.json from artifact bundle' + e);
        }

        const artifactBundleFiles: (typeof artifactBundleFilesTable.$inferInsert)[] = [];
        for (const [filePath, fileData] of Object.entries(manifest.files)) {
          if (fileData.type === 'source_map' || fileData.type === 'minified_source') {
            const debugId = fileData.headers['debug-id'];
            artifactBundleFiles.push({
              projectId: parseInt(projectId, 10),
              filePath,
              debugId,
              type: fileData.type,
              data: fileData,
              checksum,
              createdAt: new Date(),
            });
          }
        }

        await this.db.insert(artifactBundleFilesTable).values(artifactBundleFiles);

        const upload = new Upload({
          client: this.s3Client,
          params: {
            Bucket: this.bucketName,
            Key: getS3Key(entry.fileName),
            Body: manifestBuffer,
          },
          tags: [{ Key: 'projectId', Value: projectId }],
        });

        console.log(`\tUploading ${entry.fileName} to S3 at ${getS3Key(entry.fileName)}`);

        await upload.done();
      } else if (entry) {
        const stream = await zip.openReadStream(entry);

        const upload = new Upload({
          client: this.s3Client,
          params: {
            Bucket: this.bucketName,
            Key: getS3Key(entry.fileName),
            Body: stream,
          },
          tags: [{ Key: 'projectId', Value: projectId }],
        });

        console.log(`\tUploading ${entry.fileName} to S3 at ${getS3Key(entry.fileName)}`);

        await upload.done();
      }
    }

    await Promise.all(chunks.map((chunk) => this.deleteS3File(`uploads/${projectId}/${chunk}`)));

    console.log(`\tDeleted original chunks after assembly: ${chunks.join(', ')}`);
  }

  async deleteS3File(key: string) {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
    } catch (error) {
      console.error(`Failed to delete original chunk ${key}:`, error);
    }
  }
}

function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

class Zip {
  private zipFile: yauzl.ZipFile;

  constructor(zipFile: yauzl.ZipFile) {
    this.zipFile = zipFile;
  }

  static async fromBuffer(raw: Buffer): Promise<Zip> {
    return new Promise((resolve, reject) => {
      yauzl.fromBuffer(Buffer.from(raw), { lazyEntries: true }, (err, zipFile) => {
        if (err) {
          return reject(err);
        }

        resolve(new Zip(zipFile));
      });
    });
  }

  async readEntry(): Promise<Entry | null> {
    return new Promise((_resolve, reject) => {
      const resolve = (entry: Entry | null) => {
        this.zipFile.off('entry', onEntry);
        this.zipFile.off('end', onEnd);
        this.zipFile.off('error', onError);
        _resolve(entry);
      };

      const onEntry = (entry: Entry) => {
        if (entry.fileName === '') {
          // End of zip file
          return resolve(null);
        }

        resolve(entry);
      };

      const onEnd = () => {
        resolve(null);
      };

      const onError = (error: Error) => {
        this.zipFile.off('entry', onEntry);
        this.zipFile.off('end', onEnd);
        this.zipFile.off('error', onError);
        reject(error);
      };

      this.zipFile.on('entry', onEntry);
      this.zipFile.on('end', onEnd); // No more entries
      this.zipFile.on('error', onError);

      this.zipFile.readEntry();
    });
  }

  async openReadStream(entry: Entry): Promise<Readable> {
    return new Promise((resolve, reject) => {
      this.zipFile.openReadStream(entry, (err, stream) => {
        if (err) {
          return reject(err);
        }
        resolve(stream);
      });
    });
  }

  /**
   * Get async iterator for entries.
   * Usage: `for await (const entry of zip) { ... }`
   * @returns {Object} - Async iterator
   */
  [Symbol.asyncIterator]() {
    return {
      next: async () => {
        const entry = await this.readEntry();
        return { value: entry, done: entry === null };
      },
    };
  }
}
