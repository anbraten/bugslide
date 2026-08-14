import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';

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

export async function deleteS3Prefix(s3Client: S3Client, bucket: string, prefix: string) {
  let continuationToken: string | undefined;

  do {
    const listResponse = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    const objects = (listResponse.Contents ?? []).flatMap((object) => (object.Key ? [{ Key: object.Key }] : []));
    if (objects.length > 0) {
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: objects },
        }),
      );
    }

    continuationToken = listResponse.IsTruncated ? listResponse.NextContinuationToken : undefined;
  } while (continuationToken);
}
