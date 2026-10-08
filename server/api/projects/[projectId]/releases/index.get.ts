import { and, desc, eq, gte, sql } from 'drizzle-orm';

const TREND_DAYS = 14;

export default defineEventHandler(async (event) => {
  const project = await requireProject(event, getRouterParam(event, 'projectId'));

  const db = await useDb(event);

  const trendSince = new Date();
  trendSince.setDate(trendSince.getDate() - (TREND_DAYS - 1));
  trendSince.setHours(0, 0, 0, 0);

  // error_events has no project column, scope it through the error
  const inProject = eq(errorsTable.projectId, project.id);

  const [releases, stats, trendRows, fileCounts] = await Promise.all([
    db
      .select()
      .from(releasesTable)
      .where(eq(releasesTable.projectId, project.id))
      .orderBy(desc(releasesTable.createdAt)),
    db
      .select({
        version: errorEventsTable.release,
        events: sql<number>`count(*)`,
        errors: sql<number>`count(distinct ${errorEventsTable.error})`,
        newErrors: sql<number>`count(distinct case when ${errorEventsTable.eventId} = 1 then ${errorEventsTable.error} end)`,
        lastEvent: sql<number | null>`max(${errorEventsTable.createdAt})`,
      })
      .from(errorEventsTable)
      .innerJoin(errorsTable, eq(errorEventsTable.error, errorsTable.id))
      .where(inProject)
      .groupBy(errorEventsTable.release),
    db
      .select({
        version: errorEventsTable.release,
        day: sql<string>`strftime('%Y-%m-%d', ${errorEventsTable.createdAt}, 'unixepoch')`.as('day'),
        count: sql<number>`count(*)`.as('count'),
      })
      .from(errorEventsTable)
      .innerJoin(errorsTable, eq(errorEventsTable.error, errorsTable.id))
      .where(and(inProject, gte(errorEventsTable.createdAt, trendSince)))
      .groupBy(errorEventsTable.release, sql`day`),
    db
      .select({
        releaseId: artifactBundleFilesTable.releaseId,
        count: sql<number>`count(*)`,
      })
      .from(artifactBundleFilesTable)
      .where(eq(artifactBundleFilesTable.projectId, project.id))
      .groupBy(artifactBundleFilesTable.releaseId),
  ]);

  const days: string[] = [];
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  return releases.map((release) => {
    const s = stats.find((r) => r.version === release.version);
    const rows = trendRows.filter((r) => r.version === release.version);

    return {
      ...release,
      events: s?.events ?? 0,
      errors: s?.errors ?? 0,
      newErrors: s?.newErrors ?? 0,
      lastEvent: s?.lastEvent ? new Date(s.lastEvent * 1000) : null,
      files: fileCounts.find((f) => f.releaseId === release.id)?.count ?? 0,
      trend: days.map((day) => rows.find((r) => r.day === day)?.count ?? 0),
    };
  });
});
