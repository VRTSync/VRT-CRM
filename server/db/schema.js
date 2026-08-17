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

// Property profile per amendment A1: acreage and fully_maintained only.
// Service layer quantities live in customer_layers, built in a later slice.
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
  annualValue: numeric("annual_value", { precision: 12, scale: 2 }),
  termYears: integer("term_years"),
  renewalDate: date("renewal_date"),
  source: text("source"),
  status: text("status"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
