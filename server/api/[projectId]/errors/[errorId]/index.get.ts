import { and, eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const db = await useDb();

  const project = await requireProject(event, getRouterParam(event, 'projectId'));

  const errorId = getRouterParam(event, 'errorId');
  if (!errorId) {
    throw createError({
      message: 'errorId is required',
      status: 400,
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
