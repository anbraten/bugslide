import { Upload } from '@aws-sdk/lib-storage';
import { Busboy } from '@fastify/busboy';

export default defineEventHandler(async (event) => {
  const project = await requireProjectByToken(event);

  console.log('POST /api/0/organizations/anbraten/chunk-upload', {
    fileSize: getHeader(event, 'Content-Length'),
    contentType: getHeader(event, 'Content-Type'),
  });

  const s3 = await getS3Client();
  const config = await useRuntimeConfig();

  const contentType = getHeader(event, 'Content-Type') ?? 'multipart/form-data';

  const busboy = new Busboy({
    headers: { ...event.node.req.headers, 'content-type': contentType },
  });

  const uploadPromises: Promise<unknown>[] = [];

  busboy.on('file', async (fieldname, file, filename, encoding, mimetype) => {
    console.log(`\tSaving file: ${fieldname} ${filename} (${mimetype}; ${encoding})`);

    const upload = new Upload({
      client: s3,
      params: {
        Bucket: config.s3.bucket,
        Key: `uploads/${project.id}/${filename}`,
        Body: file,
        ContentType: mimetype,
      },
    });

    uploadPromises.push(upload.done());
  });

  event.node.req.pipe(busboy);

  return new Promise((resolve, reject) => {
    busboy.on('error', (err) => {
      console.error('\tBusboy error:', err);
      reject(err);
    });

    busboy.on('finish', async () => {
      try {
        await Promise.all(uploadPromises);
        console.log('\tAll uploads completed successfully');
        resolve('');
      } catch (err) {
        console.error('\tError during file uploads:', err);
        reject(err);
      }
    });
  });
});
