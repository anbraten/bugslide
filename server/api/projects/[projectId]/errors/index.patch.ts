import { and, eq, inArray } from 'drizzle-orm';

const STATES = ['open', 'resolved', 'ignored'] as const;

export default defineEventHandler(async (event) => {
  const db = await useDb(event);

  const project = await requireProject(event, getRouterParam(event, 'projectId'));

  const body = await readBody<{
    ids?: number[];
    state?: (typeof STATES)[number];
  }>(event);

  const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter(Number.isInteger) : [];
  if (ids.length === 0) {
    throw createError({
      message: 'ids is required',
      status: 400,
    });
  }

  if (!body.state || !STATES.includes(body.state)) {
    throw createError({
      message: 'state must be one of open, resolved or ignored',
      status: 400,
    });
  }

  const errors = await db
    .update(errorsTable)
    // a manual state change acknowledges a regression
    .set({ state: body.state, regressedAt: null, updatedAt: new Date() })
    .where(and(eq(errorsTable.projectId, project.id), inArray(errorsTable.id, ids)))
    .returning({ id: errorsTable.id });

  return { updated: errors.length };
});
