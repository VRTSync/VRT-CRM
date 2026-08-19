import Avatar from "./Avatar.jsx";

export default function DealCard({
  customer,
  owner,
  progress,
  error,
  onOpen,
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
      {error && <div className="deal-error" role="alert">{error}</div>}
    </article>
  );
}