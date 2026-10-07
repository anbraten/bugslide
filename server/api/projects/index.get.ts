import { and, count, eq, gte, inArray, ne, sql } from 'drizzle-orm';

const TREND_DAYS = 14;

export default defineEventHandler(async (event) => {
  const db = await useDb(event);
  const user = await requireUser(event);

  const rows = await db
    .select()
    .from(projectsTable)
    .leftJoin(userProjectsTable, eq(userProjectsTable.userId, user.id))
    .where(eq(projectsTable.id, userProjectsTable.projectId));
  const projects = rows.map((p) => p.projects);

  const projectIds = projects.map((p) => p.id);
  const trendSince = new Date();
  trendSince.setDate(trendSince.getDate() - (TREND_DAYS - 1));
  trendSince.setHours(0, 0, 0, 0);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // ignored errors are excluded from event stats, like the project activity chart
  const notIgnored = and(inArray(errorsTable.projectId, projectIds), ne(errorsTable.state, 'ignored'));

  const [openRows, recentRows, trendRows] = projectIds.length
    ? await Promise.all([
        db
          .select({ projectId: errorsTable.projectId, count: count() })
          .from(errorsTable)
          .where(and(inArray(errorsTable.projectId, projectIds), eq(errorsTable.state, 'open')))
          .groupBy(errorsTable.projectId),
        db
          .select({ projectId: errorsTable.projectId, count: count() })
          .from(errorEventsTable)
          .innerJoin(errorsTable, eq(errorEventsTable.error, errorsTable.id))
          .where(and(notIgnored, gte(errorEventsTable.createdAt, dayAgo)))
          .groupBy(errorsTable.projectId),
        db
          .select({
            projectId: errorsTable.projectId,
            day: sql<string>`strftime('%Y-%m-%d', ${errorEventsTable.createdAt}, 'unixepoch')`.as('day'),
            count: sql<number>`count(*)`.as('count'),
          })
          .from(errorEventsTable)
          .innerJoin(errorsTable, eq(errorEventsTable.error, errorsTable.id))
          .where(and(notIgnored, gte(errorEventsTable.createdAt, trendSince)))
          .groupBy(errorsTable.projectId, sql`day`),
      ])
    : [[], [], []];

  const days: string[] = [];
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  return projects.map((project) => ({
    ...project,
    openErrors: openRows.find((r) => r.projectId === project.id)?.count ?? 0,
    events24h: recentRows.find((r) => r.projectId === project.id)?.count ?? 0,
    trend: days.map(
      (day) => trendRows.find((r) => r.projectId === project.id && r.day === day)?.count ?? 0,
    ),
  }));
});
