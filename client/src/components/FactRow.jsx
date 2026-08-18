// Horizontal run of uppercase micro-label over value, per spec 6.17.
export default function FactRow({ facts }) {
  return (
    <div className="fact-row">
      {facts.map((f) => (
        <div className="fact" key={f.label}>
          <div className="f-label">{f.label}</div>
          <div className="f-value">{f.value || ""}</div>
        </div>
      ))}
    </div>
  );
}
