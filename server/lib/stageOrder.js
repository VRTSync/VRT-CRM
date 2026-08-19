// The single source of truth for the fixed eight-stage sequence and for
// classifying a stage move. The client holds display keys only; all
// direction logic lives here. churned is terminal and never in the order.
export const STAGE_ORDER = [
  "lead",
  "discovery",
  "proposal",
  "signed",
  "mapping",
  "data_load",
  "training",
  "live",
];

export function stageIndex(stage) {
  return STAGE_ORDER.indexOf(stage);
}

// Classifies a move as "forward", "backward", or "same". A move is backward
// when to_stage sits earlier in the fixed order than from_stage, at any
// distance (spec 10.2).
export function classifyMove(fromStage, toStage) {
  const from = stageIndex(fromStage);
  const to = stageIndex(toStage);
  if (from === -1 || to === -1) {
    throw new Error(`Unknown stage in move: ${fromStage} to ${toStage}`);
  }
  if (to === from) return "same";
  return to < from ? "backward" : "forward";
}

// A forward move skips a stage when it lands more than one step ahead.
export function isSkip(fromStage, toStage) {
  return stageIndex(toStage) - stageIndex(fromStage) > 1;
}
