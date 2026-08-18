const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatMoney(value) {
  return money.format(Number(value) || 0);
}

export function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

export const STAGE_LABELS = {
  lead: "Lead",
  discovery: "Discovery",
  proposal: "Proposal",
  signed: "Signed",
  mapping: "Property Mapping",
  data_load: "Data Load",
  training: "Training",
  live: "Live",
  churned: "Churned",
};

// Eight stepper stages in fixed order. churned never appears.
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
