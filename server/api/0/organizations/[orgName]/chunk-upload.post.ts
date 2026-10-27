import { Busboy } from '@fastify/busboy';
import { buffer } from 'node:stream/consumers';

export default defineEventHandler(async (event) => {
  const project = await requireProjectByToken(event);

  const s3 = getS3Client();

  const contentType = getHeader(event, 'Content-Type') ?? 'multipart/form-data';

  const busboy = new Busboy({
    headers: { ...event.node.req.headers, 'content-type': contentType },
  });

  const uploadPromises: Promise<unknown>[] = [];

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    // chunks are small (see chunkSize in chunk-upload.get.ts), so buffer them to upload with a single PUT
    uploadPromises.push(buffer(file).then((data) => s3.putObject(`uploads/${project.id}/${filename}`, data, mimetype)));
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
        resolve('');
      } catch (err) {
        console.error('\tError during file uploads:', err);
        reject(err);
      }
    });
  });
});
