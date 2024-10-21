import { sqliteTable, AnySQLiteColumn, foreignKey, integer, text } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const errors = sqliteTable("errors", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	projectId: integer().notNull().references(() => projects.id),
	createdAt: integer().notNull(),
	updatedAt: integer().notNull(),
	title: text().notNull(),
	state: text().notNull(),
	lastOccurrence: integer().notNull(),
	value: text(),
	events: integer().notNull(),
});

export const logs = sqliteTable("logs", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	projectId: integer().notNull().references(() => projects.id),
	createdAt: integer().notNull(),
	level: text().notNull(),
	message: text().notNull(),
	metadata: text(),
});

export const projects = sqliteTable("projects", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	name: text(),
});

export const errorEvents = sqliteTable("error_events", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	error: integer().notNull().references(() => errors.id),
	createdAt: integer().notNull(),
	stacktrace: text(),
	eventId: integer().notNull(),
	event: text(),
});

export const userProjects = sqliteTable("user_projects", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	userId: integer().notNull().references(() => users.id),
	projectId: integer().notNull().references(() => projects.id),
});

export const users = sqliteTable("users", {
	id: integer().primaryKey().notNull(),
	name: text(),
	avatarUrl: text(),
	email: text(),
});

