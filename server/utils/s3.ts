import { S3Client } from '@aws-sdk/client-s3';

export async function getS3Client() {
  const config = await useRuntimeConfig();

  if (!config.s3.endpoint || !config.s3.accessKey || !config.s3.secretKey) {
    throw new Error('S3 configuration is incomplete. Please check your environment variables.');
  }

  const s3 = new S3Client({
    endpoint: config.s3.endpoint,
    forcePathStyle: config.s3.forcePathStyle ?? true,
    region: config.s3.region || 'unknown',
    credentials: {
      accessKeyId: config.s3.accessKey,
      secretAccessKey: config.s3.secretKey,
    },
  });

  return s3;
}
