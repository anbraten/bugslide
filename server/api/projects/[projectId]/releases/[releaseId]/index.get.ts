import { and, desc, eq, gte, sql } from 'drizzle-orm';

const ERRORS_LIMIT = 100;
const ACTIVITY_DAYS = 30;

export default defineEventHandler(async (event) => {
  const project = await requireProject(event, getRouterParam(event, 'projectId'));

  const db = useDb(event);

  // releases are addressed by their version, the same identifier events and source map lookups use
  const version = getRouterParam(event, 'releaseId', { decode: true });
  if (!version) {
    throw createError({
      statusCode: 400,
      message: 'Release is required.',
    });
  }

  const release = await getFirstElement(
    db
      .select()
      .from(releasesTable)
      .where(and(eq(releasesTable.version, version), eq(releasesTable.projectId, project.id))),
  );

  if (!release) {
    throw createError({
      statusCode: 404,
      message: 'Release not found.',
    });
  }

  // error_events has no project column, scope it through the error
  const inRelease = and(eq(errorsTable.projectId, project.id), eq(errorEventsTable.release, version));

  const activitySince = new Date();
  activitySince.setDate(activitySince.getDate() - (ACTIVITY_DAYS - 1));
  activitySince.setHours(0, 0, 0, 0);

  const [errors, totals, activityRows, files] = await Promise.all([
    db
      .select({
        id: errorsTable.id,
        title: errorsTable.title,
        value: errorsTable.value,
        state: errorsTable.state,
        events: sql<number>`count(*)`.as('release_events'),
        firstSeen: sql<number>`min(${errorEventsTable.createdAt})`,
        lastSeen: sql<number>`max(${errorEventsTable.createdAt})`,
        latestEventId: sql<number>`max(${errorEventsTable.eventId})`,
        // the error's very first event happened in this release
        isNew: sql<number>`max(${errorEventsTable.eventId} = 1)`,
      })
      .from(errorEventsTable)
      .innerJoin(errorsTable, eq(errorEventsTable.error, errorsTable.id))
      .where(inRelease)
      .groupBy(errorsTable.id)
      .orderBy(desc(sql`release_events`))
      .limit(ERRORS_LIMIT),
    db
      .select({
        events: sql<number>`count(*)`,
        errors: sql<number>`count(distinct ${errorEventsTable.error})`,
        newErrors: sql<number>`count(distinct case when ${errorEventsTable.eventId} = 1 then ${errorEventsTable.error} end)`,
        firstEvent: sql<number | null>`min(${errorEventsTable.createdAt})`,
        lastEvent: sql<number | null>`max(${errorEventsTable.createdAt})`,
      })
      .from(errorEventsTable)
      .innerJoin(errorsTable, eq(errorEventsTable.error, errorsTable.id))
      .where(inRelease)
      .get(),
    db
      .select({
        day: sql<string>`strftime('%Y-%m-%d', ${errorEventsTable.createdAt}, 'unixepoch')`.as('day'),
        count: sql<number>`count(*)`.as('count'),
      })
      .from(errorEventsTable)
      .innerJoin(errorsTable, eq(errorEventsTable.error, errorsTable.id))
      .where(and(inRelease, gte(errorEventsTable.createdAt, activitySince)))
      .groupBy(sql`day`),
    db
      .select({
        id: artifactBundleFilesTable.id,
        type: artifactBundleFilesTable.type,
        filePath: artifactBundleFilesTable.filePath,
        debugId: artifactBundleFilesTable.debugId,
        createdAt: artifactBundleFilesTable.createdAt,
      })
      .from(artifactBundleFilesTable)
      .where(and(eq(artifactBundleFilesTable.releaseId, release.id), eq(artifactBundleFilesTable.projectId, project.id)))
      .orderBy(artifactBundleFilesTable.filePath),
  ]);

  const activity: { date: string; count: number }[] = [];
  for (let i = ACTIVITY_DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    activity.push({ date, count: activityRows.find((r) => r.day === date)?.count ?? 0 });
  }

  // raw sql aggregates come back as unix seconds, match the timestamp columns
  const toDate = (seconds: number | null | undefined) => (seconds ? new Date(seconds * 1000) : null);

  return {
    ...release,
    stats: {
      events: totals?.events ?? 0,
      errors: totals?.errors ?? 0,
      newErrors: totals?.newErrors ?? 0,
      firstEvent: toDate(totals?.firstEvent),
      lastEvent: toDate(totals?.lastEvent),
    },
    errors: errors.map((e) => ({
      ...e,
      isNew: !!e.isNew,
      firstSeen: toDate(e.firstSeen)!,
      lastSeen: toDate(e.lastSeen)!,
    })),
    activity,
    files,
  };
});
