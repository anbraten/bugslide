import { and, asc, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { UAParser } from 'ua-parser-js';
import type { ErrorSummary, TagDistribution } from '#shared/types/error-summary';

const TOP_VALUES = 10;

// built-in tags first, custom tags alphabetically after
const BUILTIN_TAG_ORDER = ['environment', 'release', 'browser', 'os', 'runtime', 'url', 'user'];

export default defineEventHandler(async (event): Promise<ErrorSummary> => {
  const db = useDb(event);

  const project = await requireProject(event, getRouterParam(event, 'projectId'));
  const errorId = parseInt(getRouterParam(event, 'errorId') ?? '', 10);
  if (isNaN(errorId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid error ID' });
  }

  const errorRow = await db
    .select({ id: errorsTable.id })
    .from(errorsTable)
    .where(and(eq(errorsTable.id, errorId), eq(errorsTable.projectId, project.id)))
    .get();
  if (!errorRow) {
    throw createError({ statusCode: 404, statusMessage: 'Error not found' });
  }

  const ofError = eq(errorEventsTable.error, errorId);
  const json = (path: string) => sql<string | null>`json_extract(${errorEventsTable.event}, ${path})`;

  // the browser SDK sends `{{auto}}` as ip placeholder which a real Sentry server would replace
  const userKey = sql<string | null>`coalesce(
    ${json('$.user.email')},
    ${json('$.user.username')},
    ${json('$.user.id')},
    nullif(${json('$.user.ip_address')}, '{{auto}}')
  )`;

  const [usersRow, firstRelease, lastRelease, releases, environments, users, urls, clients, customTags] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(distinct ${userKey})` })
        .from(errorEventsTable)
        .where(ofError)
        .get(),
      db
        .select({ release: errorEventsTable.release })
        .from(errorEventsTable)
        .where(and(ofError, isNotNull(errorEventsTable.release)))
        .orderBy(asc(errorEventsTable.eventId))
        .limit(1)
        .get(),
      db
        .select({ release: errorEventsTable.release })
        .from(errorEventsTable)
        .where(and(ofError, isNotNull(errorEventsTable.release)))
        .orderBy(desc(errorEventsTable.eventId))
        .limit(1)
        .get(),
      countBy(db, errorEventsTable.release, errorId),
      countBy(db, json('$.environment'), errorId),
      countBy(db, userKey, errorId),
      countBy(db, json('$.request.url'), errorId),
      // UAs can't be parsed in SQL, so group by the raw strings and parse the (few) distinct ones afterwards
      db
        .select({
          ua: json('$.request.headers."User-Agent"'),
          browser: json('$.contexts.browser.name'),
          browserVersion: json('$.contexts.browser.version'),
          os: json('$.contexts.os.name'),
          osVersion: json('$.contexts.os.version'),
          runtime: json('$.contexts.runtime.name'),
          runtimeVersion: json('$.contexts.runtime.version'),
          count: sql<number>`count(*)`,
        })
        .from(errorEventsTable)
        .where(ofError)
        .groupBy(sql`1, 2, 3, 4, 5, 6, 7`),
      db.all<{ key: string; value: string; count: number }>(sql`
        select t.key as key, t.value as value, count(*) as count
        from ${errorEventsTable}, json_each(json_extract(${errorEventsTable.event}, '$.tags')) as t
        where ${errorEventsTable.error} = ${errorId} and t.type in ('text', 'integer', 'real', 'true', 'false')
        group by t.key, t.value
      `),
    ]);

  const browsers = new Map<string, number>();
  const oses = new Map<string, number>();
  const runtimes = new Map<string, number>();
  for (const row of clients) {
    const ua = row.ua ? new UAParser(row.ua) : undefined;
    const browser = ua?.getBrowser();
    const os = ua?.getOS();

    increment(browsers, label(browser?.name ?? row.browser, browser?.major ?? row.browserVersion), row.count);
    increment(oses, label(os?.name ?? row.os, os?.version ?? row.osVersion), row.count);
    increment(runtimes, label(row.runtime, row.runtimeVersion), row.count);
  }

  // drop query strings and fragments, they make nearly every url unique
  const urlPaths = new Map<string, number>();
  for (const row of urls) {
    increment(urlPaths, row.value.replace(/[?#].*$/, ''), row.count);
  }

  const tags = new Map<string, Map<string, number>>([
    ['environment', toMap(environments)],
    ['release', toMap(releases)],
    ['browser', browsers],
    ['os', oses],
    ['runtime', runtimes],
    ['url', urlPaths],
    ['user', toMap(users)],
  ]);
  // explicit tags replace a derived one of the same name, the SDK knows better
  const customTagValues = new Map<string, Map<string, number>>();
  for (const row of customTags) {
    const values = customTagValues.get(row.key) ?? new Map<string, number>();
    increment(values, String(row.value), row.count);
    customTagValues.set(row.key, values);
  }
  for (const [key, values] of customTagValues) {
    tags.set(key, values);
  }

  const distributions = [...tags.entries()]
    .filter(([, values]) => values.size > 0)
    .map(([key, values]): TagDistribution => {
      const sorted = [...values.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);
      return {
        key,
        total: sorted.reduce((sum, v) => sum + v.count, 0),
        distinct: sorted.length,
        values: sorted.slice(0, TOP_VALUES),
      };
    })
    .sort((a, b) => {
      const ia = BUILTIN_TAG_ORDER.indexOf(a.key);
      const ib = BUILTIN_TAG_ORDER.indexOf(b.key);
      if (ia !== -1 || ib !== -1) {
        return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
      }
      return a.key.localeCompare(b.key);
    });

  return {
    users: usersRow?.count ?? 0,
    firstRelease: firstRelease?.release ?? null,
    lastRelease: lastRelease?.release ?? null,
    tags: distributions,
  };
});

function countBy(db: ReturnType<typeof useDb>, column: ReturnType<typeof sql> | typeof errorEventsTable.release, errorId: number) {
  return db
    .select({ value: sql<string>`${column}`, count: sql<number>`count(*)` })
    .from(errorEventsTable)
    .where(and(eq(errorEventsTable.error, errorId), sql`${column} is not null`))
    .groupBy(sql`1`);
}

function label(name: string | null | undefined, version: string | null | undefined) {
  if (!name) {
    return null;
  }
  return version ? `${name} ${version}` : name;
}

function increment(map: Map<string, number>, key: string | null, count: number) {
  if (key === null || key === '') {
    return;
  }
  map.set(key, (map.get(key) ?? 0) + count);
}

function toMap(rows: { value: string; count: number }[]) {
  return new Map(rows.map((r) => [String(r.value), r.count]));
}
