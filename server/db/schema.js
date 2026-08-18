import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Role is nullable: a user with a null role can sign in and read but
// cannot be assigned tasks. The owner assigns roles.
export const userRole = pgEnum("user_role", [
  "sales",
  "mapping",
  "admin",
  "owner",
]);

// Exactly nine stage values. churned is terminal, excluded from the board,
// retained for history.
export const customerStage = pgEnum("customer_stage", [
  "lead",
  "discovery",
  "proposal",
  "signed",
  "mapping",
  "data_load",
  "training",
  "live",
  "churned",
]);

// The four service layers per amendment A1. Scope and price only,
// no quantity or measurement columns. Measurements live in the platform.
export const serviceLayer = pgEnum("service_layer", [
  "property",
  "irrigation",
  "trees",
  "snow",
]);

export const contactType = pgEnum("contact_type", [
  "board",
  "manager",
  "contractor",
  "other",
]);

// Six note kinds. system is written only by the stage change engine.
export const noteKind = pgEnum("note_kind", [
  "call",
  "email",
  "meeting",
  "site_visit",
  "note",
  "system",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  googleSub: text("google_sub").notNull().unique(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  role: userRole("role"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Exactly four rows per customer, one per layer, created with the customer.
// A layer is never deleted, only marked out of scope.
export const customerLayers = pgTable("customer_layers", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  layer: serviceLayer("layer").notNull(),
  inScope: boolean("in_scope").notNull().default(false),
  annualPrice: numeric("annual_price", { precision: 12, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  name: text("name").notNull(),
  title: text("title"),
  organization: text("organization"),
  email: text("email"),
  phone: text("phone"),
  contactType: contactType("contact_type").notNull().default("other"),
  isPrimary: boolean("is_primary").notNull().default(false),
  notes: text("notes"),
});

// from_stage and to_stage are set only by stage change notes, which the
// stage change engine writes in a later slice. This table is the full
// stage history. There is no separate table.
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  projectId: integer("project_id"),
  authorUserId: integer("author_user_id")
    .notNull()
    .references(() => users.id),
  kind: noteKind("kind").notNull(),
  body: text("body").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  fromStage: customerStage("from_stage"),
  toStage: customerStage("to_stage"),
});

// Property profile per amendment A1: acreage and fully_maintained only.
// Scope and price per service layer live in customer_layers. Annual value
// is derived from in-scope layer prices at read time, never stored.
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  managementCompany: text("management_company"),
  isSelfManaged: boolean("is_self_managed").notNull().default(false),
  unitCount: integer("unit_count"),
  acreage: numeric("acreage", { precision: 10, scale: 2 }),
  fullyMaintained: boolean("fully_maintained").notNull().default(false),
  stage: customerStage("stage").notNull().default("lead"),
  stageEnteredAt: timestamp("stage_entered_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  ownerUserId: integer("owner_user_id").references(() => users.id),
  vrtsyncMapUrl: text("vrtsync_map_url"),
  termYears: integer("term_years"),
  renewalDate: date("renewal_date"),
  source: text("source"),
  status: text("status"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
