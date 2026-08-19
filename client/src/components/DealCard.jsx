import Avatar from "./Avatar.jsx";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_ORDER,
} from "../lib/format.js";

export default function DealCard({
  customer,
  project,
  owner,
  progress,
  error,
  onOpen,
  onDragStart,
  onStatusChange,
}) {
  const item = project || customer;
  const statusLabel = project
    ? project.customerName || "Internal"
    : customer.status || (customer.stage === "live" ? "Live" : "Active");
  const statusClass = project
    ? project.customerName
      ? "accent"
      : ""
    : customer.stage === "live"
      ? "good"
      : "";

  return (
    <article
      className="deal"
      draggable="true"
      onDragStart={(event) => onDragStart(event, item)}
    >
      <button
        type="button"
        className="deal-open"
        onClick={() => onOpen(item.id)}
      >
        <span className="d-name">{item.name}</span>
        <span className="d-meta">
          {project
            ? project.description || "No description"
            : `${customer.unitCount || 0} units · ${customer.managementCompany || "Self-managed"}`}
        </span>
      </button>
      {progress && (
        <>
          <div className="prog">
            <i style={{ width: `${progress.percent}%` }} />
          </div>
          <div className="prog-label">
            {progress.done} of {progress.total}{" "}
            {project ? "tasks complete" : "onboarding tasks"}
          </div>
        </>
      )}
      <div className="d-foot">
        <Avatar user={owner} />
        <span className={`badge${statusClass ? ` ${statusClass}` : ""}`}>
          {statusLabel}
        </span>
        {project && (
          <select
            className="project-status-select"
            aria-label={`Status for ${project.name}`}
            value={project.status}
            onChange={(event) => onStatusChange(project, event.target.value)}
          >
            {PROJECT_STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {PROJECT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        )}
      </div>
      {error && <div className="deal-error" role="alert">{error}</div>}
    </article>
  );
}