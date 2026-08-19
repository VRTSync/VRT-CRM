import { useEffect, useState } from "react";
import { STAGE_ORDER, STAGE_LABELS } from "../lib/format.js";
import { api } from "../lib/api.js";
import StageChangeDialog from "./StageChangeDialog.jsx";

// Keyboard-reachable stage selector per spec 12. The server decides whether
// a move needs a reason (backward, skip ahead, or open checklist items);
// the client asks for one only after the API says so. Errors surface inline
// on the selector, not as a toast.
export default function StageSelector({ customer, onChanged }) {
  const [pending, setPending] = useState(customer.stage);
  const [targetStage, setTargetStage] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setPending(customer.stage);
    setTargetStage(null);
    setError("");
  }, [customer.id, customer.stage]);

  function onSelect(e) {
    const stage = e.target.value;
    setPending(stage);
    if (stage === customer.stage) {
      setError("");
      return;
    }
    setError("");
    setTargetStage(stage);
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
        disabled={Boolean(targetStage)}
      >
        {STAGE_ORDER.map((key) => (
          <option key={key} value={key}>
            {STAGE_LABELS[key]}
          </option>
        ))}
      </select>
      {error && <div className="ss-error">{error}</div>}
      {targetStage && (
        <StageChangeDialog
          customer={customer}
          toStage={targetStage}
          onCancel={() => {
            setPending(customer.stage);
            setTargetStage(null);
          }}
          onChanged={(updated) => {
            setTargetStage(null);
            onChanged(updated);
          }}
          onFailed={(err) => {
            setPending(customer.stage);
            setTargetStage(null);
            setError(err.message);
            api.customer(customer.id).then(onChanged).catch(() => {});
          }}
        />
      )}
    </div>
  );
}
