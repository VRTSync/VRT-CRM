import { useEffect } from "react";

// Shared confirmation dialog for destructive and non-destructive actions.
export default function ConfirmDialog({
  title,
  confirmLabel = "Confirm",
  variant = "primary",
  onConfirm,
  onCancel,
  children,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onCancel();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const confirmClass = variant === "danger" ? "btn danger" : "btn primary";

  return (
    <div className="modal-scrim" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal card">
        <div className="card-head">
          <h2>{title}</h2>
        </div>
        <div className="card-body stack">
          {typeof children === "string" ? <p className="hint">{children}</p> : children}
          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onCancel} autoFocus>
              Cancel
            </button>
            <button type="button" className={confirmClass} onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}