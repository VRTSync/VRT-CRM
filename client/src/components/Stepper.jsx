import { STAGE_ORDER, STAGE_LABELS, formatDate } from "../lib/format.js";

// Horizontal stage stepper per spec 6.7. Eight stages, churned excluded.
// Four node states: done, current, future, behind. The behind state is
// derived from note history, never stored: a stage is behind when a system
// note shows the customer left it by moving backward past it. Hovering a
// behind node surfaces the reason from that stage change note.
function deriveBehind(notes, currentIndex) {
  const behind = {};
  if (!notes) return behind;
  const systemNotes = notes
    .filter((n) => n.kind === "system" && n.fromStage && n.toStage)
    .slice()
    .sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt));
  for (const note of systemNotes) {
    const from = STAGE_ORDER.indexOf(note.fromStage);
    const to = STAGE_ORDER.indexOf(note.toStage);
    if (from === -1 || to === -1) continue;
    if (to < from) {
      // Backward move: every stage the customer moved back past, from just
      // after the destination up to the origin, is behind with this reason.
      for (let i = to + 1; i <= from; i += 1) {
        behind[STAGE_ORDER[i]] = note.body;
      }
    } else {
      // Forward move: re-entered stages are no longer behind.
      for (let i = from; i <= to; i += 1) {
        delete behind[STAGE_ORDER[i]];
      }
    }
  }
  // Only stages still ahead of the current one render as behind.
  for (const key of Object.keys(behind)) {
    if (STAGE_ORDER.indexOf(key) <= currentIndex) delete behind[key];
  }
  return behind;
}

export default function Stepper({ stage, stageEnteredAt, notes = [] }) {
  const currentIndex = STAGE_ORDER.indexOf(stage);
  const behind = deriveBehind(notes, currentIndex);

  function stateFor(key, index) {
    if (behind[key] !== undefined) return "behind";
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
            title={state === "behind" ? behind[key] : undefined}
          >
            <div className="bar" />
            <div
              className="node"
              aria-hidden="true"
              title={state === "behind" ? behind[key] : undefined}
            >
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
