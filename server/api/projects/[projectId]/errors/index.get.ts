import { and, count, desc, eq, gte, inArray, like, or, sql } from 'drizzle-orm';
import { requireProject } from '#server/utils/auth';

const TREND_DAYS = 14;

export default defineEventHandler(async (event) => {
  const db = await useDb(event);

  const { state, sort, search, page, limit } = getQuery<{
    state?: 'open' | 'resolved' | 'ignored';
    sort?: 'lastSeen' | 'firstSeen' | 'events';
    search?: string;
    page?: string;
    limit?: string;
  }>(event);

  const project = await requireProject(event, getRouterParam(event, 'projectId'));

  const pageNum = Math.max(1, parseInt(page ?? '1', 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit ?? '50', 10)));
  const offset = (pageNum - 1) * limitNum;

  const orderBy = (() => {
    if (sort === 'firstSeen') return desc(errorsTable.createdAt);
    if (sort === 'events') return desc(errorsTable.events);
    return desc(errorsTable.lastOccurrence); // default: lastSeen
  })();

  const where = and(
    eq(errorsTable.projectId, project.id),
    state ? eq(errorsTable.state, state) : undefined,
    search ? or(like(errorsTable.title, `%${search}%`), like(errorsTable.value, `%${search}%`)) : undefined,
  );

  const [items, [totalRow]] = await Promise.all([
    db.select().from(errorsTable).where(where).orderBy(orderBy).limit(limitNum).offset(offset),
    db.select({ total: count() }).from(errorsTable).where(where),
  ]);
  const total = totalRow?.total ?? 0;

  const errorIds = items.map((item) => item.id);
  const trendSince = new Date();
  trendSince.setDate(trendSince.getDate() - (TREND_DAYS - 1));
  trendSince.setHours(0, 0, 0, 0);

  const [trendRows, firstEvents] = errorIds.length
    ? await Promise.all([
        db
          .select({
            error: errorEventsTable.error,
            day: sql<string>`strftime('%Y-%m-%d', ${errorEventsTable.createdAt}, 'unixepoch')`.as('day'),
            count: sql<number>`count(*)`.as('count'),
          })
          .from(errorEventsTable)
          .where(and(inArray(errorEventsTable.error, errorIds), gte(errorEventsTable.createdAt, trendSince)))
          .groupBy(errorEventsTable.error, sql`day`),
        db
          .select({ error: errorEventsTable.error, stacktrace: errorEventsTable.stacktrace })
          .from(errorEventsTable)
          .where(and(inArray(errorEventsTable.error, errorIds), eq(errorEventsTable.eventId, 1))),
      ])
    : [[], []];

  const days: string[] = [];
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  return {
    items: items.map((item) => ({
      ...item,
      culprit: getCulprit(firstEvents.find((e) => e.error === item.id)?.stacktrace),
      trend: days.map(
        (day) => trendRows.find((row) => row.error === item.id && row.day === day)?.count ?? 0,
      ),
    })),
    total,
    page: pageNum,
    limit: limitNum,
    pages: Math.ceil(total / limitNum),
  };
});
