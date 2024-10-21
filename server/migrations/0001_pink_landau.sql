CREATE TABLE `error_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`eventId` integer NOT NULL,
	`error` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`stacktrace` text,
	`event` text,
	FOREIGN KEY (`error`) REFERENCES `errors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`projectId` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`avatarUrl` text,
	`email` text
);
--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `errors` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL;--> statement-breakpoint
ALTER TABLE `errors` ALTER COLUMN "updatedAt" TO "updatedAt" integer NOT NULL;--> statement-breakpoint
ALTER TABLE `errors` ALTER COLUMN "lastOccurrence" TO "lastOccurrence" integer NOT NULL;--> statement-breakpoint
ALTER TABLE `errors` ADD `value` text;--> statement-breakpoint
ALTER TABLE `errors` ADD `events` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `errors` DROP COLUMN `stacktrace`;--> statement-breakpoint
ALTER TABLE `logs` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL;