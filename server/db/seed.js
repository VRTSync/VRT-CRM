// Rerunnable seed script. Resets and repopulates CRM data with fixtures
// drawn from the names, figures, and note bodies in vrtsync-crm-mockup.html.
import { sql } from "drizzle-orm";
import { db, pool } from "./index.js";
import {
  users,
  customers,
  customerLayers,
  contacts,
  notes,
  tasks,
  projects,
  taskTemplates,
  templateItems,
} from "./schema.js";

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

function daysAgo(n, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
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
    termYears: 3,
    renewalDate: "2026-11-15",
    status: "active",
  },
];

// Four layers per customer, keyed by customer name. Scope and price only,
// per amendment A1.
const LAYER_PLANS = {
  "Aspen Grove Townhomes": [
    ["property", true, "18400.00"],
    ["irrigation", true, "6200.00"],
    ["trees", false, null],
    ["snow", false, null],
  ],
  "Silver Lake Villas": [
    ["property", true, "31200.00"],
    ["irrigation", true, "9800.00"],
    ["trees", true, "4400.00"],
    ["snow", false, null],
  ],
  "Stonegate Village": [
    ["property", true, "42600.00"],
    ["irrigation", true, "12800.00"],
    ["trees", true, "6100.00"],
    ["snow", true, "9500.00"],
  ],
  "Willow Creek HOA": [
    ["property", true, "27400.00"],
    ["irrigation", true, "10200.00"],
    ["trees", true, "4800.00"],
    ["snow", true, "6200.00"],
  ],
  "Ridgeview Commons": [
    ["property", true, "33800.00"],
    ["irrigation", true, "11400.00"],
    ["trees", false, null],
    ["snow", true, "7900.00"],
  ],
  "Sagebrush Village": [
    ["property", true, "24300.00"],
    ["irrigation", true, "8600.00"],
    ["trees", true, "3900.00"],
    ["snow", false, null],
  ],
  "Lantern Hill HOA": [
    ["property", true, "28900.00"],
    ["irrigation", true, "9700.00"],
    ["trees", false, null],
    ["snow", true, "6800.00"],
  ],
  "Cedar Ridge HOA": [
    ["property", true, "30600.00"],
    ["irrigation", true, "11300.00"],
    ["trees", true, "4200.00"],
    ["snow", true, "6200.00"],
  ],
};

// Contacts per customer. At least one contractor each.
const CONTACT_PLANS = {
  "Willow Creek HOA": [
    ["Dana Whitfield", "Community Manager", "Meridian Management", "dana.w@meridianmgmt.com", "303-555-0142", "manager", true],
    ["Elaine Brooks", "Board President", "Willow Creek HOA", "ebrooks@willowcreekhoa.org", "303-555-0188", "board", false],
    ["Marcus Reyes", "Board Treasurer", "Willow Creek HOA", "mreyes@willowcreekhoa.org", "303-555-0191", "board", false],
    ["Gil Anaya", "Account Manager", "Alpine Grounds", "gil@alpinegrounds.com", "720-555-0106", "contractor", false],
    ["Renee Salas", "Operations", "Summit Snow Services", "renee@summitsnow.com", "720-555-0177", "contractor", false],
  ],
  "Aspen Grove Townhomes": [
    ["Priya Nair", "Community Manager", "Meridian Management", "priya.n@meridianmgmt.com", "303-555-0129", "manager", true],
    ["Walt Emerson", "Foreman", "Front Range Landscapes", "walt@frontrangelandscapes.com", "720-555-0134", "contractor", false],
  ],
  "Silver Lake Villas": [
    ["Colin Marsh", "Portfolio Manager", "Crestline Property", "colin.m@crestlineprop.com", "303-555-0163", "manager", true],
    ["Ana Beltran", "Board Secretary", "Silver Lake Villas", "abeltran@silverlakevillas.org", "303-555-0171", "board", false],
    ["Hector Ruiz", "Crew Lead", "Alpine Grounds", "hector@alpinegrounds.com", "720-555-0119", "contractor", false],
  ],
  "Stonegate Village": [
    ["June Okafor", "Community Manager", "Anchor Realty", "june.o@anchorrealty.com", "303-555-0147", "manager", true],
    ["Sam Whitaker", "Board President", "Stonegate Village", "swhitaker@stonegatevillage.org", "303-555-0152", "board", false],
    ["Renee Salas", "Operations", "Summit Snow Services", "renee@summitsnow.com", "720-555-0177", "contractor", false],
  ],
  "Ridgeview Commons": [
    ["Colin Marsh", "Portfolio Manager", "Crestline Property", "colin.m@crestlineprop.com", "303-555-0163", "manager", true],
    ["Gil Anaya", "Account Manager", "Alpine Grounds", "gil@alpinegrounds.com", "720-555-0106", "contractor", false],
  ],
  "Sagebrush Village": [
    ["June Okafor", "Community Manager", "Anchor Realty", "june.o@anchorrealty.com", "303-555-0147", "manager", true],
    ["Walt Emerson", "Foreman", "Front Range Landscapes", "walt@frontrangelandscapes.com", "720-555-0134", "contractor", false],
  ],
  "Lantern Hill HOA": [
    ["Nadia Sloane", "Community Manager", "Crestline Property", "nadia.s@crestlineprop.com", "303-555-0158", "manager", true],
    ["Owen Pratt", "Board Treasurer", "Lantern Hill HOA", "opratt@lanternhillhoa.org", "303-555-0183", "board", false],
    ["Hector Ruiz", "Crew Lead", "Alpine Grounds", "hector@alpinegrounds.com", "720-555-0119", "contractor", false],
  ],
  "Cedar Ridge HOA": [
    ["Dana Whitfield", "Community Manager", "Meridian Management", "dana.w@meridianmgmt.com", "303-555-0142", "manager", true],
    ["Lois Ferber", "Board President", "Cedar Ridge HOA", "lferber@cedarridgehoa.org", "303-555-0196", "board", false],
    ["Gil Anaya", "Account Manager", "Alpine Grounds", "gil@alpinegrounds.com", "720-555-0106", "contractor", false],
  ],
};

// Long note bodies taken from vrtsync-crm-mockup.html. Every user-facing
// kind appears for every customer so the Communication filters and the
// untruncated timeline can both be proven.
const NOTE_BODIES = {
  site_visit:
    "Walked the north common area with Dana from Meridian Management. Confirmed 31 irrigation zones against the as-builts, two of which are not on the 2019 drawings and will need to be added during mapping. Bed count is higher than the proposal assumed, 18 rather than 14, so the mapping pass will take an extra half day. Dana is comfortable with that and will let the board know. Gate codes for the north and west entries are in the contact record now.",
  meeting:
    "Board vote passed 5 to 0. Elaine ran through the scope one more time for the two newer board members, mostly around what mapping covers and what happens to the data if they ever change contractors. Confirmed they own the record. Marcus asked about the first invoice timing, told him it goes out after the property walk, not at signature. Executed copy is coming from Meridian tomorrow.",
  call:
    "Dana called about the snow scope line in the proposal. Their current provider handles the entry drives but not the interior sidewalks, and the board wants both mapped so they can compare bids next season. Confirmed full snow scope is what we quoted. No change to the number.",
  email:
    "Sent the revised proposal with the snow scope broken out as its own line so the board can vote on it separately. Also attached the Miramonte reference sheet since Elaine asked for a community of similar size that is already live.",
  call2:
    "Discovery follow-up with Dana. Went through the as-built situation. The 2019 irrigation drawings exist but have not been updated after the 2023 north expansion, so anything past the north gate is undocumented. This is the main reason they are looking at us.",
  note:
    "Renewal is 90 days out. They have added two common areas since the original agreement, so the acreage on file is low. Worth re-walking before we quote the renewal.",
};

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// At least 30 tasks, all source=manual, spread across the four role-holding
// users plus an unassigned set. Every badge variant appears: overdue,
// due today, due this week, blocked, done. A few have null customer so
// "Internal" renders. [title, customerName|null, role,
// assigneeKey|null, dueOffsetDays|null, status]
const TASK_PLANS = [
  // Jordan, sales
  ["Send revised proposal with snow scope broken out", "Stonegate Village", "sales", "jordan", -3, "open"],
  ["Call Dana about irrigation as-builts", "Willow Creek HOA", "sales", "jordan", 0, "open"],
  ["Prepare board presentation for scope vote", "Silver Lake Villas", "sales", "jordan", 3, "open"],
  ["Follow up on web form inquiry", "Aspen Grove Townhomes", "sales", "jordan", 5, "open"],
  ["Collect signed agreement from Meridian", "Willow Creek HOA", "sales", "jordan", -1, "open"],
  ["Send Miramonte reference sheet to Elaine", "Willow Creek HOA", "sales", "jordan", null, "done"],
  ["Draft renewal quote after re-walk", "Cedar Ridge HOA", "sales", "jordan", 12, "open"],
  // Maya, mapping
  ["Schedule property walk with Dana", "Willow Creek HOA", "mapping", "maya", 0, "open"],
  ["Map the two undocumented north zones", "Ridgeview Commons", "mapping", "maya", -5, "open"],
  ["Verify bed count against proposal", "Ridgeview Commons", "mapping", "maya", 2, "open"],
  ["Request gate codes for west entry", "Sagebrush Village", "mapping", "maya", null, "blocked"],
  ["Upload mapping pass to platform", "Sagebrush Village", "mapping", "maya", 4, "open"],
  ["Re-walk added common areas before renewal", "Cedar Ridge HOA", "mapping", "maya", 6, "open"],
  ["Close out mapping QA checklist", "Ridgeview Commons", "mapping", "maya", null, "done"],
  // Tomas, admin
  ["Send first invoice after property walk", "Willow Creek HOA", "admin", "tomas", -2, "open"],
  ["Set up training session with Lantern Hill staff", "Lantern Hill HOA", "admin", "tomas", 1, "open"],
  ["Confirm data load window with Anchor Realty", "Sagebrush Village", "admin", "tomas", 3, "open"],
  ["File executed agreement copy", "Willow Creek HOA", "admin", "tomas", null, "done"],
  ["Update contractor contact list", null, "admin", "tomas", 7, "open"],
  ["Renew business insurance certificate", null, "admin", "tomas", -8, "open"],
  ["Order field tablets for mapping crew", null, "admin", "tomas", null, "blocked"],
  // Randy, owner, tasks carry a role but he is the assignee
  ["Review Stonegate proposal pricing", "Stonegate Village", "sales", "randy", 0, "open"],
  ["Approve mapping scope change for north expansion", "Ridgeview Commons", "mapping", "randy", -1, "open"],
  ["Quarterly review of live accounts", "Cedar Ridge HOA", "admin", "randy", 5, "open"],
  ["Sign off on training curriculum", "Lantern Hill HOA", "admin", "randy", 2, "open"],
  ["Set Q3 pipeline targets", null, "sales", "randy", null, "done"],
  // Unassigned set
  ["Chase Crestline for updated as-builts", "Silver Lake Villas", "mapping", null, -4, "open"],
  ["Confirm snow scope with current provider", "Stonegate Village", "sales", null, 0, "open"],
  ["Collect W-9 from Summit Snow Services", null, "admin", null, 4, "open"],
  ["Photograph north common area beds", "Willow Creek HOA", "mapping", null, 6, "open"],
  ["Verify unit count against county records", "Aspen Grove Townhomes", "admin", null, null, "blocked"],
  ["Archive churned account records", null, "admin", null, null, "done"],
];

// Operational work spans every board status. Some projects stand alone;
// other projects remain visibly linked.
const PROJECT_PLANS = [
  ["Build contractor onboarding kit", "Package field guides and handoff materials for new contractors.", "backlog", null, "tomas", 28],
  ["Willow Creek kickoff readiness", "Coordinate access, records, and the opening property walk.", "backlog", "Willow Creek HOA", "jordan", 14],
  ["Ridgeview north expansion map", "Document the additional irrigation zones beyond the north gate.", "in_progress", "Ridgeview Commons", "maya", 9],
  ["Crew tablet refresh", "Prepare field devices and inventory for the mapping team.", "in_progress", null, "tomas", 18],
  ["Stonegate board scope packet", "Finalize the material for the upcoming scope vote.", "blocked", "Stonegate Village", "randy", 6],
  ["Knowledge base cleanup", "Archive outdated field procedures and standardize the current set.", "blocked", null, "jordan", 21],
  ["Lantern Hill training rollout", "Complete the manager and board training sequence.", "done", "Lantern Hill HOA", "tomas", -4],
  ["Q2 operations retrospective", "Capture process improvements from the latest onboarding cycle.", "done", null, "randy", -8],
];

const PROJECT_NOTES = [
  "Reviewed the working plan and identified the owners for the next round of deliverables. The project is ready to move forward once those details are confirmed.",
  "Shared the current work with the project lead. We have a clear follow-up list and will keep updates in this project timeline rather than the customer record.",
];

// The six shipped templates per spec 7.6. Signed to Onboarding matches the
// spec row for row. Annual Renewal and Post-Meeting Follow-up carry a null
// trigger_stage: they are seeded config and nothing fires them in v1.
// [name, triggerStage, [title, role, dueOffsetDays][]]
const TEMPLATE_PLANS = [
  [
    "Signed to Onboarding",
    "signed",
    [
      ["Countersign agreement and file executed copy", "admin", 1],
      ["Send welcome email and onboarding overview", "sales", 1],
      ["Schedule kickoff call with management and board", "sales", 2],
      ["Collect plat maps, as-builts, and irrigation records", "mapping", 3],
      ["Collect contractor and vendor contact list", "admin", 3],
      ["Create platform accounts for board and manager", "admin", 5],
      ["Schedule property walk for asset verification", "mapping", 7],
      ["Set up billing record and first invoice", "admin", 10],
      ["Confirm data handoff complete, advance to Mapping", "sales", 14],
    ],
  ],
  [
    "Property Mapping",
    "mapping",
    [
      ["Complete property walk and photo pass", "mapping", 2],
      ["Digitize irrigation zones from as-builts", "mapping", 4],
      ["Map beds, turf areas, and tree inventory", "mapping", 6],
      ["Map snow routes and priority areas", "mapping", 8],
      ["Reconcile mapped acreage against the agreement", "mapping", 9],
      ["Review map draft with community manager", "sales", 11],
      ["Publish final map and confirm QA checklist", "mapping", 12],
    ],
  ],
  [
    "Data Load",
    "data_load",
    [
      ["Import contractor and vendor records", "admin", 2],
      ["Load service schedules and scopes", "admin", 4],
      ["Link contracts and documents to the record", "admin", 5],
      ["Verify loaded data against source files", "mapping", 6],
      ["Confirm data load complete with manager", "sales", 7],
    ],
  ],
  [
    "Training and Go Live",
    "training",
    [
      ["Schedule training sessions with board and manager", "admin", 2],
      ["Deliver manager training session", "sales", 5],
      ["Deliver board overview session", "sales", 7],
      ["Confirm contractor access and mobile setup", "admin", 8],
      ["Run go live readiness check", "admin", 10],
      ["Switch account to Live and announce", "sales", 12],
    ],
  ],
  [
    "Annual Renewal",
    null,
    [
      ["Re-walk property and note scope changes", "mapping", 5],
      ["Prepare renewal quote", "sales", 10],
      ["Review renewal with board", "sales", 20],
      ["File signed renewal and update record", "admin", 30],
    ],
  ],
  [
    "Post-Meeting Follow-up",
    null,
    [
      ["Send meeting recap to attendees", "sales", 1],
      ["Log action items as tasks", "admin", 1],
      ["Schedule follow-up touchpoint", "sales", 5],
    ],
  ],
];

// Two test fixtures for the slice 4 DONE WHEN sequence: one customer at
// Proposal with a clean history, one at Signed with a mix of completed and
// open template tasks.
const FIXTURE_CUSTOMERS = (ownerIds) => [
  {
    name: "Birchwood Meadows HOA",
    managementCompany: "Meridian Management",
    isSelfManaged: false,
    unitCount: 132,
    acreage: "17.90",
    fullyMaintained: false,
    stage: "proposal",
    stageEnteredAt: daysAgo(4),
    ownerUserId: ownerIds.jordan,
    source: "Referral",
    status: "active",
  },
  {
    name: "Copper Sky Estates",
    managementCompany: "Anchor Realty",
    isSelfManaged: false,
    unitCount: 158,
    acreage: "20.30",
    fullyMaintained: true,
    stage: "signed",
    stageEnteredAt: daysAgo(3),
    ownerUserId: ownerIds.randy,
    termYears: 3,
    source: "Referral",
    status: "active",
  },
];

const FIXTURE_LAYERS = {
  "Birchwood Meadows HOA": [
    ["property", true, "21800.00"],
    ["irrigation", true, "7400.00"],
    ["trees", false, null],
    ["snow", false, null],
  ],
  "Copper Sky Estates": [
    ["property", true, "26500.00"],
    ["irrigation", true, "9100.00"],
    ["trees", true, "4100.00"],
    ["snow", true, "5900.00"],
  ],
};

async function seed() {
  // Reset. Truncate keeps the schema and restarts ids so reruns are stable.
  await db.execute(
    sql`TRUNCATE TABLE tasks, notes, projects, contacts, customer_layers, customers, template_items, task_templates, users RESTART IDENTITY CASCADE`
  );

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

  const layerRows = [];
  const contactRows = [];
  const noteRows = [];

  for (const customer of insertedCustomers) {
    for (const [layer, inScope, annualPrice] of LAYER_PLANS[customer.name]) {
      layerRows.push({
        customerId: customer.id,
        layer,
        inScope,
        annualPrice,
      });
    }

    for (const [name, title, organization, email, phone, contactType, isPrimary] of
      CONTACT_PLANS[customer.name]) {
      contactRows.push({
        customerId: customer.id,
        name,
        title,
        organization,
        email,
        phone,
        contactType,
        isPrimary,
      });
    }

    // Stagger occurred_at per customer so the timeline order is visible.
    const offset = customer.id;
    noteRows.push(
      {
        customerId: customer.id,
        authorUserId: ownerIds.randy,
        kind: "site_visit",
        body: NOTE_BODIES.site_visit,
        occurredAt: daysAgo(offset, 11, 20),
      },
      {
        customerId: customer.id,
        authorUserId: ownerIds.randy,
        kind: "meeting",
        body: NOTE_BODIES.meeting,
        occurredAt: daysAgo(offset + 3, 18, 30),
      },
      {
        customerId: customer.id,
        authorUserId: ownerIds.randy,
        kind: "call",
        body: NOTE_BODIES.call,
        occurredAt: daysAgo(offset + 7, 10, 15),
      },
      {
        customerId: customer.id,
        authorUserId: ownerIds.jordan,
        kind: "email",
        body: NOTE_BODIES.email,
        occurredAt: daysAgo(offset + 12, 14, 2),
      },
      {
        customerId: customer.id,
        authorUserId: ownerIds.randy,
        kind: "call",
        body: NOTE_BODIES.call2,
        occurredAt: daysAgo(offset + 18, 9, 40),
      },
      {
        customerId: customer.id,
        authorUserId: ownerIds.randy,
        kind: "note",
        body: NOTE_BODIES.note,
        occurredAt: daysAgo(offset + 21, 8, 30),
      }
    );
  }

  const insertedLayers = await db
    .insert(customerLayers)
    .values(layerRows)
    .returning();
  const insertedContacts = await db
    .insert(contacts)
    .values(contactRows)
    .returning();
  const insertedNotes = await db.insert(notes).values(noteRows).returning();

  const customerIdsByName = Object.fromEntries(
    insertedCustomers.map((c) => [c.name, c.id])
  );
  const assigneeIds = {
    randy: ownerIds.randy,
    jordan: ownerIds.jordan,
    maya: ownerIds.maya,
    tomas: ownerIds.tomas,
  };

  const projectRows = PROJECT_PLANS.map(
    ([name, description, status, customerName, leadKey, targetOffset]) => ({
      name,
      description,
      status,
      customerId: customerName ? customerIdsByName[customerName] : null,
      leadUserId: ownerIds[leadKey],
      targetDate: daysFromNow(targetOffset),
    })
  );
  const insertedProjects = await db.insert(projects).values(projectRows).returning();
  const projectByName = Object.fromEntries(
    insertedProjects.map((project) => [project.name, project])
  );

  const taskRows = TASK_PLANS.map(
    ([title, customerName, role, assigneeKey, dueOffset, status]) => ({
      title,
      customerId: customerName ? customerIdsByName[customerName] : null,
      projectId: null,
      role,
      assigneeUserId: assigneeKey ? assigneeIds[assigneeKey] : null,
      dueDate: dueOffset === null ? null : daysFromNow(dueOffset),
      status,
      source: "manual",
      completedAt: status === "done" ? daysAgo(2, 16, 0) : null,
    })
  );
  const insertedTasks = await db.insert(tasks).values(taskRows).returning();

  const projectNoteRows = insertedProjects.flatMap((project, index) => [
    {
      projectId: project.id,
      authorUserId: project.leadUserId,
      kind: "note",
      body: PROJECT_NOTES[index % PROJECT_NOTES.length],
      occurredAt: daysAgo(index + 1, 10, 30),
    },
    {
      projectId: project.id,
      authorUserId: ownerIds.randy,
      kind: index % 2 ? "email" : "meeting",
      body: "Confirmed the current priorities and logged the next action items for the project team.",
      occurredAt: daysAgo(index + 3, 15, 15),
    },
  ]);
  await db.insert(notes).values(projectNoteRows);

  const projectTaskRows = [
    ["Build contractor onboarding kit", "Outline the welcome packet", "tomas", "open"],
    ["Build contractor onboarding kit", "Review handoff checklist", "jordan", "done"],
    ["Willow Creek kickoff readiness", "Confirm property walk attendees", "jordan", "open"],
    ["Ridgeview north expansion map", "Map undocumented irrigation zones", "maya", "open"],
    ["Ridgeview north expansion map", "Upload draft map for QA", "maya", "done"],
    ["Crew tablet refresh", "Inventory current field tablets", "tomas", "open"],
    ["Stonegate board scope packet", "Collect final snow scope details", "randy", "blocked"],
    ["Knowledge base cleanup", "Confirm document retention owner", "jordan", "blocked"],
    ["Lantern Hill training rollout", "Deliver manager training", "tomas", "done"],
    ["Q2 operations retrospective", "Publish agreed process improvements", "randy", "done"],
  ].map(([projectName, title, assigneeKey, status], index) => ({
    title,
    projectId: projectByName[projectName].id,
    role: index % 3 === 0 ? "sales" : index % 3 === 1 ? "mapping" : "admin",
    assigneeUserId: ownerIds[assigneeKey],
    dueDate: daysFromNow(index + 1),
    status,
    source: "manual",
    completedAt: status === "done" ? daysAgo(1, 16, 0) : null,
  }));
  await db.insert(tasks).values(projectTaskRows);

  // Templates and their items.
  const itemIdsByTemplate = {};
  let templateCount = 0;
  let itemCount = 0;
  for (const [name, triggerStage, items] of TEMPLATE_PLANS) {
    const [tpl] = await db
      .insert(taskTemplates)
      .values({ name, triggerStage, isActive: true })
      .returning();
    const inserted = await db
      .insert(templateItems)
      .values(
        items.map(([title, role, dueOffsetDays], i) => ({
          templateId: tpl.id,
          sequence: i + 1,
          title,
          role,
          dueOffsetDays,
        }))
      )
      .returning();
    itemIdsByTemplate[name] = inserted;
    templateCount += 1;
    itemCount += inserted.length;
  }

  // Test fixtures for the slice 4 DONE WHEN sequence.
  const insertedFixtures = await db
    .insert(customers)
    .values(FIXTURE_CUSTOMERS(ownerIds))
    .returning();
  const fixtureLayerRows = [];
  for (const c of insertedFixtures) {
    for (const [layer, inScope, annualPrice] of FIXTURE_LAYERS[c.name]) {
      fixtureLayerRows.push({ customerId: c.id, layer, inScope, annualPrice });
    }
  }
  await db.insert(customerLayers).values(fixtureLayerRows);

  // Copper Sky Estates sits at Signed with a mix of completed and open
  // template tasks, plus the system note its forward move would have left.
  const copperSky = insertedFixtures.find((c) => c.name === "Copper Sky Estates");
  const signedItems = itemIdsByTemplate["Signed to Onboarding"];
  await db.insert(notes).values({
    customerId: copperSky.id,
    authorUserId: ownerIds.randy,
    kind: "system",
    body: "Advanced from Proposal to Signed.",
    fromStage: "proposal",
    toStage: "signed",
    occurredAt: daysAgo(3, 9, 0),
  });
  await db.insert(tasks).values(
    signedItems.map((item, i) => ({
      title: item.title,
      customerId: copperSky.id,
      role: item.role,
      assigneeUserId:
        item.role === "sales"
          ? ownerIds.jordan
          : item.role === "mapping"
            ? ownerIds.maya
            : ownerIds.tomas,
      dueDate: daysFromNow(item.dueOffsetDays - 3),
      status: i < 3 ? "done" : "open",
      source: "template",
      templateItemId: item.id,
      completedAt: i < 3 ? daysAgo(1, 15, 0) : null,
    }))
  );

  console.log(
    `Seeded ${templateCount} templates with ${itemCount} items, ` +
      `${insertedFixtures.length} fixture customers`
  );
  console.log(
    `Seeded ${insertedUsers.length} users, ${insertedCustomers.length} customers, ` +
      `${insertedLayers.length} layers, ${insertedContacts.length} contacts, ` +
      `${insertedNotes.length} customer notes, ${insertedTasks.length} customer tasks, ` +
      `${insertedProjects.length} projects`
  );
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    pool.end();
    process.exit(1);
  });
