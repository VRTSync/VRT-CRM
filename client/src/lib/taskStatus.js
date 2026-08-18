// Derived task display status, computed at read time and never stored.
// This is the single place the logic lives. Every component imports from
// here. Spec 3.3 sets the weight ordering: blocked and overdue read as
// alarm, due today next, due this week below that, done quiet.

function startOfDay(d) {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function parseDueDate(value) {
  if (!value) return null;
  // due_date is a plain date string, YYYY-MM-DD. Parse as local.
  const [y, m, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!y || !m || !day) return null;
  return new Date(y, m - 1, day);
}

// Returns one of: done, blocked, overdue, due-today, due-this-week, open.
export function deriveStatus(task, now = new Date()) {
  if (task.status === "done") return "done";
  if (task.status === "blocked") return "blocked";
  const due = parseDueDate(task.dueDate);
  if (!due) return "open";
  const today = startOfDay(now);
  const dueDay = startOfDay(due);
  const diffDays = Math.round((dueDay - today) / 86400000);
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "due-today";
  if (diffDays <= 7) return "due-this-week";
  return "open";
}

// Badge label and variant class per derived status.
export const STATUS_META = {
  overdue: { label: "Overdue", variant: "alarm" },
  blocked: { label: "Blocked", variant: "alarm" },
  "due-today": { label: "Due today", variant: "warn" },
  "due-this-week": { label: "This week", variant: "info" },
  done: { label: "Done", variant: "good" },
  open: { label: "Open", variant: "" },
};

export function isAlarm(status) {
  return status === "overdue" || status === "blocked";
}
