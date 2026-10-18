UPDATE `artifact_bundle_files` SET `releaseId` = (
  SELECT MIN(r2.`id`) FROM `releases` r1
  JOIN `releases` r2 ON r2.`projectId` = r1.`projectId` AND r2.`version` = r1.`version`
  WHERE r1.`id` = `artifact_bundle_files`.`releaseId`
) WHERE `releaseId` IS NOT NULL;--> statement-breakpoint
DELETE FROM `releases` WHERE `id` NOT IN (SELECT MIN(`id`) FROM `releases` GROUP BY `projectId`, `version`);--> statement-breakpoint
CREATE UNIQUE INDEX `releases_project_version_unique` ON `releases` (`projectId`,`version`);
