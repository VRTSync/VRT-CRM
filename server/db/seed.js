// Rerunnable seed script. Resets and repopulates users and customers with
// data drawn from the names and figures in vrtsync-crm-mockup.html.
import { sql } from "drizzle-orm";
import { db, pool } from "./index.js";
import { users, customers } from "./schema.js";

const SEED_USERS = [
  {
    googleSub: "seed-randy-mangel",
    email: "randy@vrtsync.com",
    name: "Randy Mangel",
    role: "owner",
  },
  {
    googleSub: "seed-jordan-diaz",
    email: "jordan@vrtsync.com",
    name: "Jordan Diaz",
    role: "sales",
  },
  {
    googleSub: "seed-maya-kessler",
    email: "maya@vrtsync.com",
    name: "Maya Kessler",
    role: "mapping",
  },
  {
    googleSub: "seed-tomas-lane",
    email: "tomas@vrtsync.com",
    name: "Tomas Lane",
    role: "admin",
  },
  {
    googleSub: "seed-sofia-cruz",
    email: "sofia@vrtsync.com",
    name: "Sofia Cruz",
    role: null,
  },
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// Communities spread across the stages, from the mockup board.
const SEED_CUSTOMERS = (ownerIds) => [
  {
    name: "Aspen Grove Townhomes",
    managementCompany: "Meridian Management",
    isSelfManaged: false,
    unitCount: 86,
    acreage: "12.10",
    fullyMaintained: false,
    stage: "lead",
    stageEnteredAt: daysAgo(6),
    ownerUserId: ownerIds.jordan,
    source: "Web form",
    status: "active",
  },
  {
    name: "Silver Lake Villas",
    managementCompany: "Crestline Property",
    isSelfManaged: false,
    unitCount: 178,
    acreage: "24.60",
    fullyMaintained: false,
    stage: "discovery",
    stageEnteredAt: daysAgo(41),
    ownerUserId: ownerIds.randy,
    source: "Referral",
    status: "active",
  },
  {
    name: "Stonegate Village",
    managementCompany: "Anchor Realty",
    isSelfManaged: false,
    unitCount: 240,
    acreage: "31.80",
    fullyMaintained: true,
    stage: "proposal",
    stageEnteredAt: daysAgo(12),
    ownerUserId: ownerIds.randy,
    source: "Referral",
    status: "active",
  },
  {
    name: "Willow Creek HOA",
    managementCompany: "Meridian Management",
    isSelfManaged: false,
    unitCount: 184,
    acreage: "22.40",
    fullyMaintained: true,
    stage: "signed",
    stageEnteredAt: daysAgo(12),
    ownerUserId: ownerIds.randy,
    annualValue: "48600.00",
    termYears: 3,
    source: "Referral",
    status: "active",
  },
  {
    name: "Ridgeview Commons",
    managementCompany: "Crestline Property",
    isSelfManaged: false,
    unitCount: 205,
    acreage: "27.30",
    fullyMaintained: false,
    stage: "mapping",
    stageEnteredAt: daysAgo(18),
    ownerUserId: ownerIds.maya,
    status: "active",
  },
  {
    name: "Sagebrush Village",
    managementCompany: "Anchor Realty",
    isSelfManaged: false,
    unitCount: 146,
    acreage: "19.50",
    fullyMaintained: false,
    stage: "data_load",
    stageEnteredAt: daysAgo(9),
    ownerUserId: ownerIds.maya,
    status: "active",
  },
  {
    name: "Lantern Hill HOA",
    managementCompany: "Crestline Property",
    isSelfManaged: false,
    unitCount: 167,
    acreage: "21.20",
    fullyMaintained: true,
    stage: "training",
    stageEnteredAt: daysAgo(5),
    ownerUserId: ownerIds.tomas,
    status: "active",
  },
  {
    name: "Cedar Ridge HOA",
    managementCompany: "Meridian Management",
    isSelfManaged: false,
    unitCount: 198,
    acreage: "25.70",
    fullyMaintained: true,
    stage: "live",
    stageEnteredAt: daysAgo(210),
    ownerUserId: ownerIds.randy,
    annualValue: "52300.00",
    termYears: 3,
    renewalDate: "2026-11-15",
    status: "active",
  },
];

async function seed() {
  // Reset. Truncate keeps the schema and restarts ids so reruns are stable.
  await db.execute(sql`TRUNCATE TABLE customers, users RESTART IDENTITY CASCADE`);

  const insertedUsers = await db.insert(users).values(SEED_USERS).returning();
  const byName = Object.fromEntries(insertedUsers.map((u) => [u.name, u.id]));
  const ownerIds = {
    randy: byName["Randy Mangel"],
    jordan: byName["Jordan Diaz"],
    maya: byName["Maya Kessler"],
    tomas: byName["Tomas Lane"],
  };

  const insertedCustomers = await db
    .insert(customers)
    .values(SEED_CUSTOMERS(ownerIds))
    .returning();

  console.log(
    `Seeded ${insertedUsers.length} users and ${insertedCustomers.length} customers`
  );
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    pool.end();
    process.exit(1);
  });
