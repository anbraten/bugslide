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
  const resolvedFrames: (StackFrame | undefined)[] = await Promise.all(
    frames.map(async (frame) => {
      try {
        const { filename, lineno, colno } = frame;
        if (!filename || !lineno || !colno) {
          return frame; // Return the original frame if essential properties are missing
        }

        if (!sourceConsumers.has(filename)) {
          const sourceConsumer = await getSourceConsumer(projectId, release, sanitizeFilePath(filename));
          sourceConsumers.set(filename, sourceConsumer);
        }

        const sourceConsumer = sourceConsumers.get(filename) as SourceMapConsumer;
        console.log('frame', { filename, lineno, colno }, sourceConsumers.has(filename));

        const resolvedFrame = await resolveSourceFrame(sourceConsumer, lineno, colno);
        return { ...frame, ...resolvedFrame };
      } catch (error) {
        console.error('Error resolving source frame:', error);
        return frame; // Return the original frame in case of an error
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
  const mapKey = `source-maps/${projectId}/${release}/${filePath}.map`;

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

async function resolveSourceFrame(consumer: SourceMapConsumer, line: number, column: number): Promise<StackFrame> {
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
