import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import ConfirmDialog from "./ConfirmDialog.jsx";
import { STAGE_LABELS } from "../lib/format.js";

function countLabel(count, singular) {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

// Loads the server-owned preview before showing confirmation copy, then sends
// every confirmed move through the existing stage-change endpoint.
export default function StageChangeDialog({
  customer,
  toStage,
  onCancel,
  onOptimistic,
  onChanged,
  onFailed,
}) {
  const [preview, setPreview] = useState(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .previewStageChange(customer.id, toStage)
      .then((result) => {
        if (active) setPreview(result);
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
          onFailed?.(err);
        }
      });
    return () => {
      active = false;
    };
  }, [customer.id, toStage]);

  async function confirm() {
    if (!preview || (preview.reasonRequired && !reason.trim())) return;
    setBusy(true);
    setError("");
    onOptimistic?.();
    try {
      const updated = await api.changeStage(customer.id, toStage, reason.trim() || undefined);
      onChanged(updated);
    } catch (err) {
      setError(err.message);
      onFailed?.(err);
    } finally {
      setBusy(false);
    }
  }

  if (error && !preview) return null;
  if (!preview) return null;

  const isBackward = preview.direction === "backward";
  const title = isBackward
    ? `Move back to ${STAGE_LABELS[toStage]}?`
    : `Move to ${STAGE_LABELS[toStage]}?`;
  const confirmLabel = isBackward ? "Move Back" : "Move Forward";

  return (
    <ConfirmDialog
      title={title}
      confirmLabel={confirmLabel}
      variant={isBackward ? "danger" : "primary"}
      confirmDisabled={busy || (preview.reasonRequired && !reason.trim())}
      onConfirm={confirm}
      onCancel={busy ? () => {} : onCancel}
    >
      <div className="stage-change-copy stack">
        {isBackward ? (
          <p className="hint">
            {countLabel(preview.backward.openDeleteCount, "open checklist item")} will
            be deleted. {countLabel(preview.backward.completedKeepCount, "completed checklist item")} will be kept.
          </p>
        ) : (
          <>
            <p className="hint">
              This move will create {countLabel(preview.forward.taskCount, "task")} for{" "}
              {countLabel(preview.forward.assigneeCount, "assignee")}.
            </p>
            {preview.forward.assignees.length > 0 && (
              <p className="hint">
                {preview.forward.assignees
                  .map((assignee) => `${assignee.name}: ${assignee.count}`)
                  .join(", ")}
              </p>
            )}
            {preview.carryForwardCount > 0 && (
              <p className="hint">
                {countLabel(preview.carryForwardCount, "open checklist item")} will
                be carried forward.
              </p>
            )}
          </>
        )}
        {preview.reasonRequired && (
          <label className="stage-reason-label">
            Reason for this stage change
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain this move"
              autoFocus
            />
          </label>
        )}
        {error && <p className="ss-error">{error}</p>}
      </div>
    </ConfirmDialog>
  );
}