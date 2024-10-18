import { and, eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, 'projectId');
  if (!projectId) {
    throw createError({
      message: 'projectId is required',
      status: 400,
    });
  }

  const errorId = getRouterParam(event, 'errorId');
  if (!errorId) {
    throw createError({
      message: 'errorId is required',
      status: 400,
    });
  }

  const db = await useDb();
  const project = await getFirstElement(
    db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, parseInt(projectId, 10))),
  );
  if (!project) {
    throw createError({
      message: 'Project not found',
      status: 404,
    });
  }

  const error = await getFirstElement(
    db
      .select()
      .from(errorsTable)
      .where(and(eq(errorsTable.projectId, project.id), eq(errorsTable.id, parseInt(errorId, 10)))),
  );

  return error;
});
