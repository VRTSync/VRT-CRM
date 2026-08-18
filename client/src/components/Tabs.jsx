// Customer record tabs, per spec 3.6. No other screen introduces tabs.
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={active === tab.id ? "active" : undefined}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.count != null && <span className="n">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}
