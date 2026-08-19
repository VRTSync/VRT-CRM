import Avatar from "./Avatar.jsx";
import { STAGE_ORDER, STAGE_LABELS } from "../lib/format.js";

export default function DealCard({
  customer,
  owner,
  progress,
  error,
  onOpen,
  onMove,
  onDragStart,
}) {
  const statusLabel = customer.status || (customer.stage === "live" ? "Live" : "Active");
  const statusClass = customer.stage === "live" ? "good" : "";

  return (
    <article
      className="deal"
      draggable="true"
      onDragStart={(event) => onDragStart(event, customer)}
    >
      <button
        type="button"
        className="deal-open"
        onClick={() => onOpen(customer.id)}
      >
        <span className="d-name">{customer.name}</span>
        <span className="d-meta">
          {customer.unitCount || 0} units · {customer.managementCompany || "Self-managed"}
        </span>
      </button>
      {progress && (
        <>
          <div className="prog">
            <i style={{ width: `${progress.percent}%` }} />
          </div>
          <div className="prog-label">
            {progress.done} of {progress.total} onboarding tasks
          </div>
        </>
      )}
      <div className="d-foot">
        <Avatar user={owner} />
        <span className={`badge${statusClass ? ` ${statusClass}` : ""}`}>
          {statusLabel}
        </span>
      </div>
      <label className="deal-stage-control">
        <span>Move to</span>
        <select
          value={customer.stage}
          onChange={(event) => onMove(customer, event.target.value)}
          aria-label={`Move ${customer.name} to another stage`}
        >
          {STAGE_ORDER.map((stage) => (
            <option key={stage} value={stage}>{STAGE_LABELS[stage]}</option>
          ))}
        </select>
      </label>
      {error && <div className="deal-error" role="alert">{error}</div>}
    </article>
  );
}