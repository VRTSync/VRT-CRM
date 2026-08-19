export default function KpiTile({ label, value, sublabel, kind = "navy" }) {
  return (
    <div className={`kpi k-${kind}`}>
      <div className="k-label">{label}</div>
      <div className="k-value">{value}</div>
      <div className="k-sub">{sublabel}</div>
    </div>
  );
}