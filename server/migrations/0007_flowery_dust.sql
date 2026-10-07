ALTER TABLE `users` ADD `apiToken` text;--> statement-breakpoint
CREATE UNIQUE INDEX `users_apiToken_unique` ON `users` (`apiToken`);