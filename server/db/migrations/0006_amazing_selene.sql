ALTER TABLE "tasks" DROP CONSTRAINT "tasks_exactly_one_parent_check";--> statement-breakpoint
UPDATE "tasks"
SET "project_id" = NULL
WHERE "project_id" IN (
  SELECT "id"
  FROM "projects"
  WHERE "name" = 'Internal Operations'
);--> statement-breakpoint
DELETE FROM "projects"
WHERE "name" = 'Internal Operations'
  AND NOT EXISTS (
    SELECT 1
    FROM "tasks"
    WHERE "tasks"."project_id" = "projects"."id"
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "notes"
    WHERE "notes"."project_id" = "projects"."id"
  );