import { deriveStatus, STATUS_META } from "../lib/taskStatus.js";
import { formatDate } from "../lib/format.js";
import Select from "./Select.jsx";

const ROLE_LABELS = { sales: "Sales", mapping: "Mapping", admin: "Admin" };

// The four-fact task row per spec 3.4 and 6.4: leading checkbox, grow
// region with title and meta line, trailing status badge. Role badges are
// outlined; status badges are filled.
export default function TaskRow({ task, onToggle, onAssign, users }) {
  const done = task.status === "done";
  const status = deriveStatus(task);
  const meta = STATUS_META[status];
  const badgeLabel =
    (status === "open" || status === "due-this-week") && task.dueDate
      ? formatDate(task.dueDate)
      : meta.label;

  return (
    <div className={`row${done ? " done" : ""}`}>
      <button
        type="button"
        className={`check${done ? " done" : ""}`}
        aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
        aria-pressed={done}
        onClick={() => onToggle && onToggle(task, done ? "open" : "done")}
      >
        {done ? "\u2713" : ""}
      </button>
      <div className="grow">
        <div className="r-title">{task.title}</div>
        <div className="r-meta">
          <span>{task.customerName || task.projectName || "Internal"}</span>
          {(task.assigneeName || task.role) && <span className="sep">&middot;</span>}
          {task.assigneeName ? (
            <span>{task.assigneeName}</span>
          ) : task.role ? (
            <span className="badge role">{ROLE_LABELS[task.role]}</span>
          ) : null}
          {task.source === "template" && (
            <>
              <span className="sep">&middot;</span>
              <span>From template</span>
            </>
          )}
        </div>
      </div>
      <div className="trail">
        {onAssign && users && (
          <Select
            aria-label={`Assign ${task.title}`}
            value=""
            onChange={(e) => {
              if (e.target.value) onAssign(task, Number(e.target.value));
            }}
          >
            <option value="">Assign</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        )}
        <span className={`badge ${meta.variant}`.trim()}>{badgeLabel}</span>
      </div>
    </div>
  );
}
