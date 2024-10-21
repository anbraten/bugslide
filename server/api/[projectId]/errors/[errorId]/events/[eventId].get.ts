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
  if (!error) {
    throw createError({
      message: 'Error not found',
      status: 404,
    });
  }

  const eventId = getRouterParam(event, 'eventId');
  if (!eventId) {
    throw createError({
      message: 'eventId is required',
      status: 400,
    });
  }

  const errorEvent = await getFirstElement(
    db
      .select()
      .from(errorEventsTable)
      .where(and(eq(errorEventsTable.error, error.id), eq(errorEventsTable.eventId, parseInt(eventId, 10)))),
  );

  return errorEvent;
});
