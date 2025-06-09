import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { Event, Stacktrace } from '@sentry/core';
import { InferSelectModel } from 'drizzle-orm';
import type { H3Event } from 'h3';

let db: ReturnType<typeof drizzle> | null = null;

export function useDb(event: H3Event) {
  if (db) {
    return db;
  }

  const config = useRuntimeConfig(event);
  const client = createClient({
    url: config.db.tursoDatabaseUrl,
    authToken: config.db.tursoAuthToken,
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
  publicSecret: text().notNull(),
});
export type Project = InferSelectModel<typeof projectsTable>;

export const usersTable = sqliteTable('users', {
  id: int('id').primaryKey(),
  name: text('name'),
  avatarUrl: text('avatarUrl'),
  email: text('email').unique(),
});
export type User = InferSelectModel<typeof usersTable>;

export const userProjectsTable = sqliteTable('user_projects', {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int()
    .references(() => usersTable.id)
    .notNull(),
  projectId: int()
    .references(() => projectsTable.id)
    .notNull(),
  token: text(),
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
  state: text().notNull().$type<'open' | 'resolved' | 'ignored'>(),
  events: int().notNull(),
  lastOccurrence: int({ mode: 'timestamp' }).notNull(),
});
export type CaughtError = InferSelectModel<typeof errorsTable>;

export const errorEventsTable = sqliteTable('error_events', {
  id: int().primaryKey({ autoIncrement: true }),
  eventId: int().notNull(),
  error: int()
    .references(() => errorsTable.id)
    .notNull(),
  createdAt: int({ mode: 'timestamp' }).notNull(),
  stacktrace: text({ mode: 'json' }).$type<Stacktrace>(),
  release: text(),
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

export const releasesTable = sqliteTable('releases', {
  id: int().primaryKey({ autoIncrement: true }),
  projectId: int()
    .references(() => projectsTable.id)
    .notNull(),
  version: text().notNull(),
  createdAt: int({ mode: 'timestamp' }).notNull(),
});
