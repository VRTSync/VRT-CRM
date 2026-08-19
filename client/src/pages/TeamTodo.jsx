import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import FilterBar from "../components/FilterBar.jsx";
import PersonCard from "../components/PersonCard.jsx";
import TaskComposer from "../components/TaskComposer.jsx";
import { deriveStatus } from "../lib/taskStatus.js";

const ROLE_LABELS = { sales: "Sales", mapping: "Mapping", admin: "Admin" };

// Sort inside a card by weight: alarm first, then due today, this week,
// open, done last. Spec 3.3.
const WEIGHT = {
  overdue: 0,
  blocked: 1,
  "due-today": 2,
  "due-this-week": 3,
  open: 4,
  done: 5,
};

function byWeight(a, b) {
  const wa = WEIGHT[deriveStatus(a)];
  const wb = WEIGHT[deriveStatus(b)];
  if (wa !== wb) return wa - wb;
  return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
}

export default function TeamTodo({ composerOpen, onComposerClose, grouping }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [role, setRole] = useState("all");
  const [view, setView] = useState("none");

  function load() {
    api.getTasks().then(setTasks);
  }

  useEffect(() => {
    load();
    Promise.all([api.users(), api.customers(), api.projects()]).then(
      ([userRows, customerRows, projectRows]) => {
        setUsers(userRows);
        setCustomers(customerRows);
        setProjects(projectRows);
      }
    );
  }, []);

  const assignable = users.filter((u) => u.role);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (role !== "all" && t.role !== role) return false;
      const s = deriveStatus(t);
      if (view === "overdue" && s !== "overdue" && s !== "blocked") return false;
      if (view === "week" && s !== "due-today" && s !== "due-this-week")
        return false;
      if (view === "unassigned" && t.assigneeUserId !== null) return false;
      return true;
    });
  }, [tasks, role, view]);

  async function toggle(task, status) {
    await api.updateTask(task.id, { status });
    load();
  }

  async function assign(task, userId) {
    await api.updateTask(task.id, { assigneeUserId: userId });
    load();
  }

  // Build the card groups per the grouping control. Person is default;
  // Unassigned is always last in Person view.
  const cards = useMemo(() => {
    const out = [];
    if (grouping === "customer") {
      const groups = new Map();
      for (const t of filtered) {
        const key = t.customerName || t.projectName || "Internal";
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(t);
      }
      [...groups.keys()].sort().forEach((name) => {
        out.push({
          key: `c-${name}`,
          label: name,
          sublabel: name === "Internal" ? "Not tied to a customer" : "Customer",
          tasks: groups.get(name).sort(byWeight),
          showAvatar: false,
        });
      });
    } else if (grouping === "role") {
      for (const r of ["sales", "mapping", "admin"]) {
        const rows = filtered.filter((t) => t.role === r).sort(byWeight);
        out.push({
          key: `r-${r}`,
          label: ROLE_LABELS[r],
          sublabel: "Role",
          tasks: rows,
          showAvatar: false,
        });
      }
      const noRole = filtered.filter((t) => !t.role).sort(byWeight);
      if (noRole.length) {
        out.push({
          key: "r-none",
          label: "No role",
          sublabel: "Role not set",
          tasks: noRole,
          showAvatar: false,
        });
      }
    } else {
      for (const u of assignable) {
        out.push({
          key: `u-${u.id}`,
          user: u,
          tasks: filtered.filter((t) => t.assigneeUserId === u.id).sort(byWeight),
        });
      }
      out.push({
        key: "unassigned",
        user: null,
        tasks: filtered.filter((t) => t.assigneeUserId === null).sort(byWeight),
        unassigned: true,
      });
    }
    return out;
  }, [filtered, grouping, assignable]);

  return (
    <>
      <div className="callout">
        <span className="ci">&#9432;</span>
        <span>
          Tasks come from three places: <b>templates</b> fired by stage change,{" "}
          <b>meeting action items</b>, and <b>manual entries</b>.
        </span>
      </div>
      {composerOpen && (
        <TaskComposer
          users={users}
          customers={customers}
          projects={projects}
          onSaved={() => {
            load();
            if (onComposerClose) onComposerClose();
          }}
          onCancel={onComposerClose}
        />
      )}
      <FilterBar role={role} view={view} onRole={setRole} onView={setView} />
      <div className="g-half person-grid">
        {cards.map((c) => (
          <PersonCard
            key={c.key}
            user={c.user}
            label={c.label}
            sublabel={c.sublabel}
            tasks={c.tasks}
            onToggle={toggle}
            onAssign={c.unassigned ? assign : undefined}
            users={c.unassigned ? assignable : undefined}
            showAvatar={c.showAvatar !== false}
          />
        ))}
      </div>
    </>
  );
}
