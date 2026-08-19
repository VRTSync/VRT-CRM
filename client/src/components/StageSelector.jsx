import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { STAGE_ORDER, STAGE_LABELS } from "../lib/format.js";

// Keyboard-reachable stage selector per spec 12. The server decides whether
// a move needs a reason (backward, skip ahead, or open checklist items);
// the client asks for one only after the API says so. Errors surface inline
// on the selector, not as a toast.
export default function StageSelector({ customer, onChanged }) {
  const [pending, setPending] = useState(customer.stage);
  const [reason, setReason] = useState("");
  const [needsReason, setNeedsReason] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPending(customer.stage);
    setReason("");
    setNeedsReason(false);
    setError("");
  }, [customer.id, customer.stage]);

  async function submit(stage, typedReason) {
    setBusy(true);
    setError("");
    try {
      const updated = await api.changeStage(
        customer.id,
        stage,
        typedReason || undefined
      );
      setNeedsReason(false);
      setReason("");
      onChanged(updated);
    } catch (err) {
      if (err.status === 400 && !typedReason) {
        // The move requires a typed reason. Show the input and keep the
        // pending selection.
        setNeedsReason(true);
        setError(err.message);
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  function onSelect(e) {
    const stage = e.target.value;
    setPending(stage);
    if (stage === customer.stage) {
      setNeedsReason(false);
      setError("");
      return;
    }
    submit(stage, "");
  }

  return (
    <div className="stage-select">
      <label className="ss-label" htmlFor="stage-selector">
        Stage
      </label>
      <select
        id="stage-selector"
        value={pending}
        onChange={onSelect}
        disabled={busy}
      >
        {STAGE_ORDER.map((key) => (
          <option key={key} value={key}>
            {STAGE_LABELS[key]}
          </option>
        ))}
      </select>
      {needsReason && (
        <form
          className="ss-reason"
          onSubmit={(e) => {
            e.preventDefault();
            if (reason.trim()) submit(pending, reason.trim());
          }}
        >
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this customer moving?"
            aria-label="Reason for stage change"
            autoFocus
          />
          <button
            type="submit"
            className="btn sm primary"
            disabled={busy || !reason.trim()}
          >
            Move
          </button>
          <button
            type="button"
            className="btn sm ghost"
            onClick={() => {
              setPending(customer.stage);
              setNeedsReason(false);
              setReason("");
              setError("");
            }}
          >
            Cancel
          </button>
        </form>
      )}
      {error && <div className="ss-error">{error}</div>}
    </div>
  );
}
