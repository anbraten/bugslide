export default defineEventHandler(async (event) => {
  const project = await requireProjectByToken(event);

  const body = await readBody<{
    version: string;
    projects: string[];
    dateStarted: string;
  }>(event);

  console.log('POST /api/0/projects/anbraten/javascript-vue/releases', {
    body,
  });

  // TODO: return proper response
  return {
    version: body.version ?? '1.2.3',
    dateCreated: new Date().toISOString(),
  };
});
