import { SourceMapConsumer } from 'source-map';
import { Readable } from 'node:stream';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { StackFrame } from '@sentry/core';

function streamToString(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    stream.on('error', reject);
  });
}

export async function resolveSourceFrames(projectId: string, release: string, frames: StackFrame[]) {
  const s3Client = await getS3Client();
  const sourceMapResolver = new SourceMapResolver({ s3Client, release, projectId });

  await Promise.all(frames.map(async (frame) => sourceMapResolver.loadSourceConsumerByFrame(frame).catch(() => {})));

  const resolvedFrames: (StackFrame | undefined)[] = await Promise.all(
    frames.map(async (frame) => {
      try {
        const { lineno, colno } = frame;
        if (!lineno || !colno) {
          return frame; // Return the original frame if essential properties are missing
        }

        const sourceConsumer = sourceMapResolver.getSourceConsumerByFrame(frame);
        if (!sourceConsumer) {
          return frame; // Return the original frame if no source consumer is found
        }

        const resolvedFrame = await sourceMapResolver.resolveSourceFrame(sourceConsumer, lineno, colno);
        return { ...frame, ...resolvedFrame };
      } catch (error) {
        // console.error('Error resolving source frame:', error);
        return frame; // Return the original frame in case of an error
      }
    }),
  );

  await sourceMapResolver.cleanup();

  return resolvedFrames;
}

class SourceMapResolver {
  s3Client: S3Client;
  sourceConsumers: Map<string, SourceMapConsumer> = new Map();
  projectId: string;
  release: string;

  constructor({ s3Client, projectId, release }: { s3Client: S3Client; projectId: string; release: string }) {
    this.s3Client = s3Client;
    this.projectId = projectId;
    this.release = release;
  }

  getSourceConsumerByFrame(frame: StackFrame): SourceMapConsumer | null {
    const { filename, debug_id } = frame;

    // try with debug-id first
    if (debug_id) {
      return this.sourceConsumers.get(`debug-${debug_id}`) ?? null;
    }

    if (filename) {
      return this.sourceConsumers.get(`file-${filename}`) ?? null;
    }

    return null;
  }

  async loadSourceConsumerByFrame(frame: StackFrame): Promise<void> {
    const { filename, debug_id } = frame;

    const existingConsumer = this.getSourceConsumerByFrame(frame);
    if (existingConsumer) {
      return;
    }

    // try with debug-id first
    if (debug_id) {
      const sourceConsumer = await this.getSourceConsumerByDebugID(debug_id);
      this.sourceConsumers.set(`debug-${debug_id}`, sourceConsumer);
      return;
    }

    if (filename) {
      const sourceConsumer = await this.getSourceConsumerByPath(filename);
      this.sourceConsumers.set(`file-${filename}`, sourceConsumer);
      return;
    }

    return;
  }

  async cleanup() {
    // Clean up the consumers after use
    for (const sourceConsumer of this.sourceConsumers.values()) {
      sourceConsumer.destroy();
    }
  }

  async getSourceConsumerByPath(filePath: string): Promise<SourceMapConsumer> {
    const mapKey = `projects/${this.projectId}/source_maps/${this.release}/${sanitizeFilePath(filePath)}.map`;

    const config = useRuntimeConfig();

    const object = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: config.s3.bucket,
        Key: mapKey,
      }),
    );

    const mapContent = await streamToString(object.Body as Readable);

    return await new SourceMapConsumer(mapContent);
  }

  async getSourceConsumerByDebugID(debugId: string): Promise<SourceMapConsumer> {
    const mapKey = `projects/${this.projectId}/artifact_bundles/${debugId}.js.map`; // TODO: we probably need to query db here

    const config = useRuntimeConfig();

    const object = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: config.s3.bucket,
        Key: mapKey,
      }),
    );

    const mapContent = await streamToString(object.Body as Readable);

    return await new SourceMapConsumer(mapContent);
  }

  async resolveSourceFrame(consumer: SourceMapConsumer, line: number, column: number): Promise<StackFrame> {
    const pos = consumer.originalPositionFor({ line, column });

    let lines: string[] | undefined;
    try {
      const content = consumer.sourceContentFor(pos.source!);
      if (content) {
        lines = content.split('\n');
      }
    } catch {
      // source content may be unavailable
    }

    const lineNumber = pos.line ?? 0;
    const previousPostLines = 3;

    return {
      filename: pos.source || undefined,
      lineno: pos.line || undefined,
      colno: pos.column || undefined,
      function: pos.name || undefined,
      pre_context: lines?.slice(Math.max(lineNumber - previousPostLines, 0), lineNumber - 1),
      context_line: lines?.[lineNumber - 1],
      post_context: lines?.slice(lineNumber, Math.min(lineNumber + previousPostLines)),
      vars: {
        resolved: true,
      },
    } satisfies StackFrame;
  }
}

function sanitizeFilePath(filePath: string): string {
  let sanitizedPath = filePath.trim();
  if (sanitizedPath.startsWith('http://') || sanitizedPath.startsWith('https://')) {
    // If the filePath is a URL, extract the path part
    try {
      const url = new URL(sanitizedPath);
      sanitizedPath = url.pathname;
    } catch (error) {
      // console.error('Invalid URL:', sanitizedPath, error);
      return '';
    }
  }

  // Remove leading slashes and ensure no directory traversal characters
  return sanitizedPath.replace(/^\//, '').replace(/(\.\.\/|\/\.\.)/g, '');
}
