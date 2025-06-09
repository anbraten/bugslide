export default defineEventHandler(async (event) => {
  const project = await requireProjectByToken(event);

  const releaseId = getRouterParam(event, 'release');

  console.log('GET /api/0/projects/anbraten/javascript-vue/releases/1.2.3', {
    releaseId,
  });

  // TODO: return proper response
  return {
    version: releaseId,
    dateCreated: new Date().toISOString(),
  };
});
