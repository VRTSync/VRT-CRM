import Avatar from "./Avatar.jsx";
import TaskRow from "./TaskRow.jsx";
import { deriveStatus, isAlarm } from "../lib/taskStatus.js";

const ROLE_LABELS = {
  sales: "Sales",
  mapping: "Mapping",
  admin: "Admin",
  owner: "Owner",
};

// One card per person (or the Unassigned sentinel, or a customer or role
// group). Header carries avatar, name, role, and an open/overdue summary.
// The card header rule reads alarm when any row is overdue or blocked,
// per spec 3.3.
export default function PersonCard({
  user,
  label,
  sublabel,
  tasks,
  onToggle,
  onAssign,
  users,
  showAvatar = true,
}) {
  const open = tasks.filter((t) => t.status !== "done").length;
  const overdue = tasks.filter((t) => isAlarm(deriveStatus(t))).length;
  const alarm = overdue > 0;
  const name = label || (user ? user.name : "Unassigned");
  const role = sublabel ?? (user ? ROLE_LABELS[user.role] || "" : "Anyone can claim");

  return (
    <div className={`card${alarm ? " k-alarm" : ""}`}>
      <div className="person-head">
        {showAvatar && <Avatar user={user || null} />}
        <div>
          <div className="p-name">{name}</div>
          {role && <div className="p-role">{role}</div>}
        </div>
        <div className="p-counts">
          <span className="badge">{open} open</span>
          {overdue > 0 && <span className="badge alarm">{overdue} overdue</span>}
        </div>
      </div>
      <div className="card-body flush">
        {tasks.length === 0 && (
          <div className="row">
            <div className="grow r-meta">No tasks match the current filters.</div>
          </div>
        )}
        {tasks.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            onToggle={onToggle}
            onAssign={onAssign}
            users={users}
          />
        ))}
      </div>
    </div>
  );
}
