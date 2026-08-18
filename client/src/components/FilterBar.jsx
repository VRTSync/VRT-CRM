// Two chip groups separated by a gap, per spec 7.4: role filters and view
// filters. One active per group. Active chip per spec 6.9.
export const ROLE_FILTERS = [
  { id: "all", label: "All roles" },
  { id: "sales", label: "Sales" },
  { id: "mapping", label: "Mapping" },
  { id: "admin", label: "Admin" },
];

export const VIEW_FILTERS = [
  { id: "none", label: "All tasks" },
  { id: "overdue", label: "Overdue only" },
  { id: "week", label: "This week" },
  { id: "unassigned", label: "Unassigned" },
];

function ChipGroup({ options, active, onChange }) {
  return (
    <div className="chips">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`chip${active === o.id ? " active" : ""}`}
          onClick={() => onChange(o.id)}
          aria-pressed={active === o.id}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function FilterBar({ role, view, onRole, onView }) {
  return (
    <div className="filterbar">
      <ChipGroup options={ROLE_FILTERS} active={role} onChange={onRole} />
      <ChipGroup options={VIEW_FILTERS} active={view} onChange={onView} />
    </div>
  );
}
