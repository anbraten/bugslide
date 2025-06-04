import { SourceMapConsumer } from 'source-map';
import { Readable } from 'node:stream';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { StackFrame } from '@sentry/core';

interface ResolvedFrame {
  filePath?: string;
  source?: string;
  line?: number;
  column?: number;
  name?: string;
  context?: string[];
}

function streamToString(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    stream.on('error', reject);
  });
}

export async function resolveSourceFrames(projectId: string, release: string, frames: StackFrame[]) {
  const sourceConsumers = new Map<string, SourceMapConsumer>();
  const resolvedFrames: (ResolvedFrame | undefined)[] = await Promise.all(
    frames.map(async (frame) => {
      const { filename, lineno, colno } = frame;
      if (!filename || !lineno || !colno) {
        return;
      }

      if (!sourceConsumers.has(filename)) {
        sourceConsumers.set(filename, await getSourceConsumer(projectId, release, filename));
      }

      const sourceConsumer = sourceConsumers.get(filename) as SourceMapConsumer;

      try {
        return { ...frame, ...(await resolveSourceFrameFromS3(sourceConsumer, lineno, colno)) };
      } catch (error) {
        console.error('Error resolving source frame:', error);
        return frame as ResolvedFrame; // Return the original frame in case of an error
      }
    }),
  );

  // Clean up the consumer after use
  for (const sourceConsumer of sourceConsumers.values()) {
    sourceConsumer.destroy();
  }

  return resolvedFrames;
}

function sanitizeFilePath(filePath: string): string {
  let sanitizedPath = filePath.trim();
  if (sanitizedPath.startsWith('http://') || sanitizedPath.startsWith('https://')) {
    // If the filePath is a URL, extract the path part
    try {
      const url = new URL(sanitizedPath);
      sanitizedPath = url.pathname;
    } catch (error) {
      console.error('Invalid URL:', sanitizedPath, error);
      return '';
    }
  }

  // Remove leading slashes and ensure no directory traversal characters
  return sanitizedPath.replace(/^\//, '').replace(/(\.\.\/|\/\.\.)/g, '');
}

async function getSourceConsumer(projectId: string, release: string, filePath: string): Promise<SourceMapConsumer> {
  const mapKey = `source-maps/${projectId}/${release}/${sanitizeFilePath(filePath)}.map`;

  const s3 = await getS3Client();
  const config = useRuntimeConfig();

  const object = await s3.send(
    new GetObjectCommand({
      Bucket: config.s3.bucket,
      Key: mapKey,
    }),
  );

  const mapContent = await streamToString(object.Body as Readable);

  return await new SourceMapConsumer(mapContent);
}

export async function resolveSourceFrameFromS3(
  consumer: SourceMapConsumer,
  line: number,
  column: number,
): Promise<ResolvedFrame> {
  const pos = consumer.originalPositionFor({ line, column });

  let context: string[] | undefined;
  try {
    const content = consumer.sourceContentFor(pos.source!);
    if (content) {
      const lines = content.split('\n');
      const start = Math.max(0, (pos.line || 1) - 3);
      const end = (pos.line || 1) + 2;
      context = lines.slice(start, end);
    }
  } catch {
    // source content may be unavailable
  }

  return {
    source: pos.source || undefined,
    line: pos.line || undefined,
    column: pos.column || undefined,
    name: pos.name || undefined,
    context,
  };
}
