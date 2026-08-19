import { desc, eq, isNull } from "drizzle-orm";
import { db } from "../db/index.js";
import { customers, notes, projects, tasks, users } from "../db/schema.js";
import { STAGE_ORDER } from "./stageOrder.js";

const ACTIVE_PIPELINE_STAGES = ["lead", "discovery", "proposal", "signed"];
const ONBOARDING_STAGES = ["mapping", "data_load", "training"];
const STALE_STAGES = new Set(["lead", "discovery", "proposal"]);
const ROLE_LABELS = {
  sales: "Sales",
  mapping: "Mapping",
  admin: "Admin",
  owner: "Owner",
};
const STAGE_LABELS = {
  lead: "Lead",
  discovery: "Discovery",
  proposal: "Proposal",
  signed: "Signed",
  mapping: "Property Mapping",
  data_load: "Data Load",
  training: "Training",
  live: "Live",
};
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysSince(value, now) {
  if (!value) return null;
  return Math.floor((startOfDay(now) - startOfDay(value)) / DAY_MS);
}

function isToday(value, now) {
  if (!value) return false;
  return startOfDay(value).getTime() === startOfDay(now).getTime();
}

function isOverdue(task, now) {
  if (task.status !== "open" || !task.dueDate) return false;
  const due = new Date(`${String(task.dueDate).slice(0, 10)}T00:00:00`);
  return due < startOfDay(now);
}

function todoSort(a, b, now) {
  const aDone = a.status === "done";
  const bDone = b.status === "done";
  if (aDone !== bDone) return aDone ? 1 : -1;

  if (aDone && bDone) {
    const completedDifference =
      new Date(b.completedAt || 0) - new Date(a.completedAt || 0);
    return completedDifference || a.id - b.id;
  }

  const aDate = a.dueDate ? String(a.dueDate).slice(0, 10) : null;
  const bDate = b.dueDate ? String(b.dueDate).slice(0, 10) : null;
  if (!aDate && bDate) return 1;
  if (aDate && !bDate) return -1;
  if (aDate && bDate && aDate !== bDate) return aDate.localeCompare(bDate);
  return a.id - b.id;
}

function signal(customer, kind, explanation, extra = {}) {
  return {
    customerId: customer.id,
    customerName: customer.name,
    stage: customer.stage,
    kind,
    label: kind[0].toUpperCase() + kind.slice(1),
    explanation,
    ...extra,
  };
}

function stageLabel(stage) {
  return STAGE_LABELS[stage] || stage;
}

export async function getDashboardData(userId, now = new Date()) {
  const [customerRows, activityRows, taskRows, activeUsers] = await Promise.all([
    db.select().from(customers),
    db
      .select({
        id: notes.id,
        customerId: notes.customerId,
        kind: notes.kind,
        body: notes.body,
        occurredAt: notes.occurredAt,
        createdAt: notes.createdAt,
        authorUserId: notes.authorUserId,
        authorName: users.name,
        customerName: customers.name,
      })
      .from(notes)
      .innerJoin(customers, eq(notes.customerId, customers.id))
      .leftJoin(users, eq(notes.authorUserId, users.id))
      .where(isNull(notes.projectId))
      .orderBy(desc(notes.occurredAt), desc(notes.id)),
    db
      .select({
        task: tasks,
        customerName: customers.name,
        projectName: projects.name,
        assigneeName: users.name,
        customerStage: customers.stage,
      })
      .from(tasks)
      .leftJoin(customers, eq(tasks.customerId, customers.id))
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(users, eq(tasks.assigneeUserId, users.id)),
    db.select().from(users).where(eq(users.isActive, true)),
  ]);

  const customerById = new Map(customerRows.map((customer) => [customer.id, customer]));
  const latestActivityByCustomer = new Map();
  for (const activity of activityRows) {
    if (!latestActivityByCustomer.has(activity.customerId)) {
      latestActivityByCustomer.set(activity.customerId, activity);
    }
  }

  const dashboardTasks = taskRows.map(
    ({ task, customerName, projectName, assigneeName, customerStage }) => ({
      ...task,
      customerName,
      projectName,
      assigneeName,
      customerStage,
    })
  );
  const nonChurnedTasks = dashboardTasks.filter(
    (task) => task.customerStage !== "churned"
  );

  const activeCustomers = customerRows.filter((customer) => customer.stage !== "churned");
  const pipelineCounts = Object.fromEntries(STAGE_ORDER.map((stage) => [stage, 0]));
  for (const customer of activeCustomers) {
    if (pipelineCounts[customer.stage] !== undefined) {
      pipelineCounts[customer.stage] += 1;
    }
  }

  const myOpenTasks = nonChurnedTasks.filter(
    (task) => task.assigneeUserId === userId && task.status !== "done"
  );
  const myOverdueTasks = myOpenTasks.filter((task) => isOverdue(task, now));
  const myTodo = nonChurnedTasks
    .filter(
      (task) =>
        task.assigneeUserId === userId &&
        (task.status !== "done" || isToday(task.completedAt, now))
    )
    .sort((a, b) => todoSort(a, b, now));

  const stale = [];
  for (const customer of activeCustomers) {
    if (!STALE_STAGES.has(customer.stage)) continue;
    const latest = latestActivityByCustomer.get(customer.id);
    const lastContactAt = latest?.occurredAt || customer.createdAt;
    const days = daysSince(lastContactAt, now);
    if (days > 21) {
      stale.push(
        signal(
          customer,
          "stale",
          `No note logged in ${days} days, in ${stageLabel(customer.stage)}.`,
          { daysSinceContact: days, lastContactAt }
        )
      );
    }
  }

  const blockedByCustomer = new Map();
  for (const task of nonChurnedTasks) {
    if (
      task.status !== "blocked" ||
      !task.customerId ||
      task.customerStage === "churned"
    ) {
      continue;
    }
    if (!blockedByCustomer.has(task.customerId)) {
      blockedByCustomer.set(task.customerId, task);
    }
  }
  const blocked = [...blockedByCustomer.values()].map((task) => {
    const customer = customerById.get(task.customerId);
    return signal(customer, "blocked", `Blocked task: ${task.title}.`, {
      taskId: task.id,
      taskTitle: task.title,
    });
  });

  const slow = [];
  for (const customer of activeCustomers) {
    if (customer.stage === "live") continue;
    const days = daysSince(customer.stageEnteredAt, now);
    if (days > 30) {
      slow.push(
        signal(customer, "slow", `${days} days in ${stageLabel(customer.stage)}.`, {
          daysInStage: days,
        })
      );
    }
  }

  const attention = {
    stale,
    blocked,
    slow,
    counts: {
      stale: stale.length,
      blocked: blocked.length,
      slow: slow.length,
    },
    all: [...stale, ...blocked, ...slow],
  };

  const workload = activeUsers.map((user) => {
    const userTasks = nonChurnedTasks.filter(
      (task) => task.assigneeUserId === user.id
    );
    const openTasks = userTasks.filter((task) => task.status !== "done");
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      roleLabel: ROLE_LABELS[user.role] || "No role yet",
      openTasks: openTasks.length,
      overdueTasks: openTasks.filter((task) => isOverdue(task, now)).length,
    };
  });
  const unassignedTasks = nonChurnedTasks.filter(
    (task) => !task.assigneeUserId && task.status !== "done"
  );
  if (unassignedTasks.length) {
    workload.push({
      id: null,
      name: "Unassigned",
      role: null,
      roleLabel: "Needs an owner",
      openTasks: unassignedTasks.length,
      overdueTasks: unassignedTasks.filter((task) => isOverdue(task, now)).length,
    });
  }
  workload.sort(
    (a, b) => b.openTasks - a.openTasks || b.overdueTasks - a.overdueTasks || a.name.localeCompare(b.name)
  );

  return {
    kpis: {
      activePipeline: activeCustomers.filter((customer) =>
        ACTIVE_PIPELINE_STAGES.includes(customer.stage)
      ).length,
      onboarding: activeCustomers.filter((customer) =>
        ONBOARDING_STAGES.includes(customer.stage)
      ).length,
      live: activeCustomers.filter((customer) => customer.stage === "live").length,
      myOpenTasks: myOpenTasks.length,
      myOverdueTasks: myOverdueTasks.length,
    },
    myTodo,
    recentActivity: activityRows.slice(0, 10),
    pipeline: STAGE_ORDER.map((stage) => ({
      stage,
      label: stageLabel(stage),
      count: pipelineCounts[stage],
    })),
    attention,
    teamLoad: workload,
  };
}