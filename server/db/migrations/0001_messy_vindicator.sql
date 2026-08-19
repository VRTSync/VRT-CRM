CREATE TABLE "task_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"trigger_stage" "customer_stage",
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"sequence" integer NOT NULL,
	"title" text NOT NULL,
	"role" "task_role" NOT NULL,
	"due_offset_days" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "template_items" ADD CONSTRAINT "template_items_template_id_task_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."task_templates"("id") ON DELETE no action ON UPDATE no action;