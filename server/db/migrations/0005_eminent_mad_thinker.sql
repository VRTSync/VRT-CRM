DO $$
DECLARE
  fallback_user_id integer;
  fallback_project_id integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM "tasks"
    WHERE "customer_id" IS NOT NULL AND "project_id" IS NOT NULL
  ) OR EXISTS (
    SELECT 1 FROM "notes"
    WHERE "customer_id" IS NOT NULL AND "project_id" IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cannot add parent constraints while records have two parents';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "tasks"
    WHERE "customer_id" IS NULL AND "project_id" IS NULL
  ) OR EXISTS (
    SELECT 1 FROM "notes"
    WHERE "customer_id" IS NULL AND "project_id" IS NULL
  ) THEN
    SELECT "id" INTO fallback_user_id
    FROM "users"
    ORDER BY CASE WHEN "role" = 'owner' THEN 0 ELSE 1 END, "id"
    LIMIT 1;

    IF fallback_user_id IS NULL THEN
      RAISE EXCEPTION 'Cannot assign parentless records without a project lead';
    END IF;

    SELECT "id" INTO fallback_project_id
    FROM "projects"
    WHERE "customer_id" IS NULL AND "name" = 'Internal Operations'
    ORDER BY "id"
    LIMIT 1;

    IF fallback_project_id IS NULL THEN
      INSERT INTO "projects" (
        "name",
        "description",
        "status",
        "lead_user_id"
      ) VALUES (
        'Internal Operations',
        'Legacy internal work grouped during the Projects workspace migration.',
        'backlog',
        fallback_user_id
      )
      RETURNING "id" INTO fallback_project_id;
    END IF;

    UPDATE "tasks"
    SET "project_id" = fallback_project_id
    WHERE "customer_id" IS NULL AND "project_id" IS NULL;

    UPDATE "notes"
    SET "project_id" = fallback_project_id
    WHERE "customer_id" IS NULL AND "project_id" IS NULL;
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_exactly_one_parent_check" CHECK (("notes"."customer_id" is not null) <> ("notes"."project_id" is not null));--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_exactly_one_parent_check" CHECK (("tasks"."customer_id" is not null) <> ("tasks"."project_id" is not null));