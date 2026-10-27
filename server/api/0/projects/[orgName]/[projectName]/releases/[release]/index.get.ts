export default defineEventHandler(async (event) => {
  const project = await requireProjectByToken(event);

  const releaseId = getRouterParam(event, 'release');

  // TODO: return proper response
  return {
    version: releaseId,
    dateCreated: new Date().toISOString(),
  };
});
