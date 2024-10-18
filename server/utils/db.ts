import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { Event, Stacktrace } from '@sentry/types';

let db: ReturnType<typeof drizzle> | null = null;

export function useDb() {
  if (db) {
    return db;
  }

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  db = drizzle(client);
  return db;
}

export async function getFirstElement<T>(p: Promise<T[]>): Promise<T | null> {
  const items = await p;
  return items && items.length > 0 ? items[0] : null;
}

export const projectsTable = sqliteTable('projects', {
  id: int().primaryKey({ autoIncrement: true }),
  name: text(),
});

export const sessionsTable = sqliteTable('sessions', {
  id: int().primaryKey({ autoIncrement: true }),
  projectId: int()
    .references(() => projectsTable.id)
    .notNull(),
  session: text(),
  createdAt: text(),
});

export const errorsTable = sqliteTable('errors', {
  id: int().primaryKey({ autoIncrement: true }),
  projectId: int()
    .references(() => projectsTable.id)
    .notNull(),
  createdAt: int({ mode: 'timestamp' }).notNull(),
  updatedAt: int({ mode: 'timestamp' }).notNull(),
  title: text().notNull(),
  value: text(),
  state: text().notNull().$type<'open' | 'closed' | 'ignored'>(),
  events: int().notNull(),
  lastOccurrence: int({ mode: 'timestamp' }).notNull(),
});

export const errorEventsTable = sqliteTable('error_events', {
  id: int().primaryKey({ autoIncrement: true }),
  eventId: int().notNull(),
  error: int()
    .references(() => errorsTable.id)
    .notNull(),
  createdAt: int({ mode: 'timestamp' }).notNull(),
  stacktrace: text({ mode: 'json' }).$type<Stacktrace>(),
  event: text({ mode: 'json' }).$type<Event>(),
});

export const logsTable = sqliteTable('logs', {
  id: int().primaryKey({ autoIncrement: true }),
  projectId: int()
    .references(() => projectsTable.id)
    .notNull(),
  createdAt: int({ mode: 'timestamp' }).notNull(),
  level: text().notNull().$type<'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug'>(),
  message: text().notNull(),
  metadata: text({ mode: 'json' }),
});
