-- Renumber event ids per error by insertion order. Before the fix in beb6185 event ids lagged
-- behind the counter, leaving a duplicate eventId 1 and a missing last event for every error.
UPDATE `error_events` SET `eventId` = (
  SELECT r.`rn` FROM (
    SELECT `id`, ROW_NUMBER() OVER (PARTITION BY `error` ORDER BY `id`) AS `rn`
    FROM `error_events`
  ) r
  WHERE r.`id` = `error_events`.`id`
);--> statement-breakpoint
UPDATE `errors` SET `events` = (
  SELECT COUNT(*) FROM `error_events` WHERE `error_events`.`error` = `errors`.`id`
);
