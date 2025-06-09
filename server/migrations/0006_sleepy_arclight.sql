CREATE TABLE `artifact_bundle_files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`projectId` integer NOT NULL,
	`releaseId` integer,
	`type` text NOT NULL,
	`filePath` text NOT NULL,
	`debugId` text,
	`checksum` text,
	`data` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`releaseId`) REFERENCES `releases`(`id`) ON UPDATE no action ON DELETE no action
);
