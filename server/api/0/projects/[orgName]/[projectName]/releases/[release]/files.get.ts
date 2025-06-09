// GET /api/0/projects/anbraten/javascript-vue/releases/1.2.3/files/?cursor=&checksum=0
// body: []

export default defineEventHandler(async (event) => {
  const project = await requireProjectByToken(event);
  const release = getRouterParam(event, 'release');

  const { cursor, checksum } = getQuery<{
    cursor?: string;
    checksum?: string | string[];
  }>(event);

  const checksums = Array.isArray(checksum) ? checksum : [checksum];
  if (!checksums || checksums.length === 0) {
    return [];
  }

  console.log('GET /api/0/projects/anbraten/javascript-vue/releases/1.2.3/files', {
    release,
    cursor,
    checksums,
  });

  return [];
});
