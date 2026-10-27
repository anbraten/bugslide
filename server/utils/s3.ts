import { S3mini } from 's3mini';

export function getS3Client() {
  const config = useRuntimeConfig();

  if (!config.s3.endpoint || !config.s3.accessKey || !config.s3.secretKey) {
    throw new Error('S3 configuration is incomplete. Please check your environment variables.');
  }

  // s3mini expects the bucket to be part of the endpoint
  const endpoint = new URL(config.s3.endpoint);
  if (config.s3.forcePathStyle ?? true) {
    endpoint.pathname = `${endpoint.pathname.replace(/\/+$/, '')}/${config.s3.bucket}`;
  } else {
    endpoint.hostname = `${config.s3.bucket}.${endpoint.hostname}`;
  }

  return new S3mini({
    endpoint: endpoint.toString(),
    region: config.s3.region || 'unknown',
    accessKeyId: config.s3.accessKey,
    secretAccessKey: config.s3.secretKey,
  });
}

export async function deleteS3Prefix(s3Client: S3mini, prefix: string) {
  const objects = await s3Client.listObjects('/', prefix);
  if (objects && objects.length > 0) {
    await s3Client.deleteObjects(objects.map((object) => object.Key));
  }
}
