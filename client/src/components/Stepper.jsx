import { STAGE_ORDER, STAGE_LABELS, formatDate } from "../lib/format.js";

// Horizontal stage stepper per spec 6.7. Eight stages, churned excluded.
// Four node states: done, current, future, behind. Nothing in this slice
// produces a behind node, but the state renders when behindStages names one.
export default function Stepper({ stage, stageEnteredAt, behindStages = [] }) {
  const currentIndex = STAGE_ORDER.indexOf(stage);

  function stateFor(key, index) {
    if (behindStages.includes(key)) return "behind";
    if (index === currentIndex) return "current";
    if (index < currentIndex) return "done";
    return "future";
  }

  return (
    <div className="stepper">
      {STAGE_ORDER.map((key, index) => {
        const state = stateFor(key, index);
        // Connectors filled to the current stage, unfilled after.
        // A connector into a behind node renders unfilled.
        const marks = { done: "\u2713", current: String(index + 1) };
        return (
          <div
            className={`step${state === "future" ? "" : ` ${state}`}`}
            key={key}
          >
            <div className="bar" />
            <div className="node" aria-hidden="true">
              {state === "behind" ? "!" : marks[state] || index + 1}
            </div>
            <div className="s-name">{STAGE_LABELS[key]}</div>
            {state === "done" && stageEnteredAt && index === currentIndex - 1 && (
              <div className="s-date">{formatDate(stageEnteredAt)}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
