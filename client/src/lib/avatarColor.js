// Deterministic avatar color from the user id. The same user is the same
// color on every screen, and the palette survives staff changes. Colors are
// the --av-* tokens defined in tokens.css. --av-0 is the unassigned gray.
const PALETTE_SIZE = 6;

export function avatarColor(userId) {
  if (userId === null || userId === undefined) {
    return "var(--av-0)";
  }
  const id = Number(userId);
  const index = (Math.abs(id) % PALETTE_SIZE) + 1;
  return `var(--av-${index})`;
}

export function initials(name) {
  if (!name) return "--";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "--";
}
