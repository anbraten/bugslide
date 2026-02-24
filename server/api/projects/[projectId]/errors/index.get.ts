import { and, count, desc, eq, like, or } from 'drizzle-orm';
import { requireProject } from '#server/utils/auth';

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

  const [items, [{ total }]] = await Promise.all([
    db.select().from(errorsTable).where(where).orderBy(orderBy).limit(limitNum).offset(offset),
    db.select({ total: count() }).from(errorsTable).where(where),
  ]);

  return {
    items,
    total,
    page: pageNum,
    limit: limitNum,
    pages: Math.ceil(total / limitNum),
  };
});
