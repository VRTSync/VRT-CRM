// Confirmation dialog for the destructive actions in spec 8. Deleting a
// template row is one of the three; nothing proceeds until confirmed.
export default function ConfirmDelete({ title, message, onConfirm, onCancel }) {
  return (
    <div className="modal-scrim" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal card">
        <div className="card-head">
          <h2>{title}</h2>
        </div>
        <div className="card-body stack">
          <p className="hint">{message}</p>
          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onCancel} autoFocus>
              Cancel
            </button>
            <button type="button" className="btn danger" onClick={onConfirm}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
