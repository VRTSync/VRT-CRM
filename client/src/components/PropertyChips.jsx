// Four property profile chips per amendment A1: layer name plus In scope
// or Not in scope. Status is never carried by the color square alone.
const LAYER_LABELS = {
  property: "Property",
  irrigation: "Irrigation",
  trees: "Trees",
  snow: "Snow",
};

const LAYER_ORDER = ["property", "irrigation", "trees", "snow"];

export default function PropertyChips({ layers }) {
  const byLayer = Object.fromEntries((layers || []).map((l) => [l.layer, l]));
  return (
    <div className="prop-chips">
      {LAYER_ORDER.map((key) => {
        const row = byLayer[key];
        const inScope = Boolean(row && row.inScope);
        return (
          <span className="pchip" key={key}>
            <i
              style={{
                background: inScope ? "var(--accent)" : "var(--line)",
              }}
            />
            {LAYER_LABELS[key]} <b>{inScope ? "In scope" : "Not in scope"}</b>
          </span>
        );
      })}
    </div>
  );
}
