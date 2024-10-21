import { relations } from "drizzle-orm/relations";
import { projects, errors, logs, errorEvents, userProjects, users } from "./schema";

export const errorsRelations = relations(errors, ({one, many}) => ({
	project: one(projects, {
		fields: [errors.projectId],
		references: [projects.id]
	}),
	errorEvents: many(errorEvents),
}));

export const projectsRelations = relations(projects, ({many}) => ({
	errors: many(errors),
	logs: many(logs),
	userProjects: many(userProjects),
}));

export const logsRelations = relations(logs, ({one}) => ({
	project: one(projects, {
		fields: [logs.projectId],
		references: [projects.id]
	}),
}));

export const errorEventsRelations = relations(errorEvents, ({one}) => ({
	error: one(errors, {
		fields: [errorEvents.error],
		references: [errors.id]
	}),
}));

export const userProjectsRelations = relations(userProjects, ({one}) => ({
	project: one(projects, {
		fields: [userProjects.projectId],
		references: [projects.id]
	}),
	user: one(users, {
		fields: [userProjects.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	userProjects: many(userProjects),
}));