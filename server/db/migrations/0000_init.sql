CREATE TYPE "public"."contact_type" AS ENUM('board', 'manager', 'contractor', 'other');--> statement-breakpoint
CREATE TYPE "public"."customer_stage" AS ENUM('lead', 'discovery', 'proposal', 'signed', 'mapping', 'data_load', 'training', 'live', 'churned');--> statement-breakpoint
CREATE TYPE "public"."note_kind" AS ENUM('call', 'email', 'meeting', 'site_visit', 'note', 'system');--> statement-breakpoint
CREATE TYPE "public"."service_layer" AS ENUM('property', 'irrigation', 'trees', 'snow');--> statement-breakpoint
CREATE TYPE "public"."task_role" AS ENUM('sales', 'mapping', 'admin');--> statement-breakpoint
CREATE TYPE "public"."task_source" AS ENUM('template', 'meeting', 'manual');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('open', 'done', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('sales', 'mapping', 'admin', 'owner');--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"organization" text,
	"email" text,
	"phone" text,
	"contact_type" "contact_type" DEFAULT 'other' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "customer_layers" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"layer" "service_layer" NOT NULL,
	"in_scope" boolean DEFAULT false NOT NULL,
	"annual_price" numeric(12, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"management_company" text,
	"is_self_managed" boolean DEFAULT false NOT NULL,
	"unit_count" integer,
	"acreage" numeric(10, 2),
	"fully_maintained" boolean DEFAULT false NOT NULL,
	"stage" "customer_stage" DEFAULT 'lead' NOT NULL,
	"stage_entered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"owner_user_id" integer,
	"vrtsync_map_url" text,
	"term_years" integer,
	"renewal_date" date,
	"source" text,
	"status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"project_id" integer,
	"author_user_id" integer NOT NULL,
	"kind" "note_kind" NOT NULL,
	"body" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"from_stage" "customer_stage",
	"to_stage" "customer_stage"
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"customer_id" integer,
	"project_id" integer,
	"role" "task_role",
	"assignee_user_id" integer,
	"due_date" date,
	"status" "task_status" DEFAULT 'open' NOT NULL,
	"source" "task_source" DEFAULT 'manual' NOT NULL,
	"template_item_id" integer,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"google_sub" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"avatar_url" text,
	"role" "user_role",
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_google_sub_unique" UNIQUE("google_sub")
);
--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_layers" ADD CONSTRAINT "customer_layers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_user_id_users_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;