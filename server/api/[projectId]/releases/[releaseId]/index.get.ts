import { and, eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const project = await requireProject(event, getRouterParam(event, 'projectId'));

  const db = await useDb(event);

  const releaseId = getRouterParam(event, 'releaseId');
  if (!releaseId) {
    throw createError({
      statusCode: 400,
      message: 'Release ID is required.',
    });
  }

  const release = await getFirstElement(
    db
      .select()
      .from(releasesTable)
      .where(and(eq(releasesTable.id, parseInt(releaseId, 10)), eq(releasesTable.projectId, project.id))),
  );

  if (!release) {
    throw createError({
      statusCode: 404,
      message: 'Release not found.',
    });
  }

  return release;
});
