export default defineEventHandler(async (event) => {
  const project = await requireProjectByToken(event);
  const orgName = getRouterParam(event, 'orgName');

  const config = useRuntimeConfig(event);
  const host = config.public.host;
  const url = `${host}/api/0/organizations/${orgName}/chunk-upload/`;

  console.log('GET /api/0/organizations/anbraten/chunk-upload', {
    orgName,
  });

  return {
    url,
    chunkSize: 8388608,
    chunksPerRequest: 64,
    maxFileSize: 4294967296,
    maxRequestSize: 33554432,
    concurrency: 8,
    hashAlgorithm: 'sha1',
    compression: ['gzip'],
    accept: [
      'debug_files',
      'release_files',
      'pdbs',
      'sources',
      'bcsymbolmaps',
      'il2cpp',
      'portablepdbs',
      'artifact_bundles',
      'artifact_bundles_v2',
      'proguard',
      'preprod_artifacts',
    ],
  };
});
