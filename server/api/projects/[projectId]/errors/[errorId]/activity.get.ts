import { and, eq, gte, sql } from 'drizzle-orm';
import { requireProject } from '#server/utils/auth';

export default defineEventHandler(async (event) => {
  const db = useDb(event);

  const project = await requireProject(event, getRouterParam(event, 'projectId'));
  const errorIdParam = getRouterParam(event, 'errorId');
  const errorId = parseInt(errorIdParam ?? '', 10);

  if (isNaN(errorId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid error ID' });
  }

  // Verify the error belongs to this project
  const errorRow = await db
    .select()
    .from(errorsTable)
    .where(and(eq(errorsTable.id, errorId), eq(errorsTable.projectId, project.id)))
    .get();
  if (!errorRow) {
    throw createError({ statusCode: 404, statusMessage: 'Error not found' });
  }

  // Last 30 days — createdAt is stored as Unix seconds (mode: 'timestamp')
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      day: sql<string>`strftime('%Y-%m-%d', ${errorEventsTable.createdAt}, 'unixepoch')`.as('day'),
      count: sql<number>`count(*)`.as('count'),
    })
    .from(errorEventsTable)
    .where(and(eq(errorEventsTable.error, errorId), gte(errorEventsTable.createdAt, thirtyDaysAgo)))
    .groupBy(sql`day`)
    .orderBy(sql`day`);

  // Fill in all 30 days so the chart shows gaps correctly
  const result: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const row = rows.find((r) => r.day === key);
    result.push({ date: key, count: row ? row.count : 0 });
  }

  return result;
});
