import { createOrGetRelease } from '#server/utils/releases';

export default defineEventHandler(async (event) => {
  const project = await requireProject(event, getRouterParam(event, 'projectId'));

  const releaseId = getRouterParam(event, 'releaseId');
  if (!releaseId) {
    throw createError({
      statusCode: 400,
      message: 'Release parameter is required.',
    });
  }

  // create release on the fly if it does not exist
  const release = await createOrGetRelease(event, project, releaseId);

  const sourceMapPath = `source-maps/${project.id}/${release.id}/`;

  // TODO: allow to upload source maps
  throw createError({
    statusCode: 501,
    message: 'Source map upload is not implemented yet.',
  });
});
