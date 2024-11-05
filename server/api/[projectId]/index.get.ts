export default defineEventHandler(async (event) => {
  const project = await requireProject(event, getRouterParam(event, 'projectId'));

  return project;
});
