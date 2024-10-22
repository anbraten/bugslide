import { and, eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const db = await useDb(event);

  const project = await requireProject(event, getRouterParam(event, 'projectId'));

  const errorId = getRouterParam(event, 'errorId');
  if (!errorId) {
    throw createError({
      message: 'errorId is required',
      status: 400,
    });
  }

  const body = await readBody<{
    state?: 'open' | 'closed' | 'ignored';
  }>(event);

  const error = await db
    .update(errorsTable)
    .set({ state: body.state, updatedAt: new Date() })
    .where(and(eq(errorsTable.projectId, project.id), eq(errorsTable.id, parseInt(errorId, 10))))
    .returning()
    .get();

  return error;
});
