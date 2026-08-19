import { useState } from "react";

const ROLE_LABELS = { sales: "Sales", mapping: "Mapping", admin: "Admin" };

// Editable template row per spec 6.12: sequence, title (grow), role badge,
// due offset. Fixed widths on the trailing two so the column reads
// vertically. Drag to reorder writes the new sequence; delete asks first.
export default function TemplateRow({
  item,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  dragging,
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [role, setRole] = useState(item.role);
  const [offset, setOffset] = useState(item.dueOffsetDays);

  function save() {
    const patch = {};
    if (title.trim() && title.trim() !== item.title) patch.title = title.trim();
    if (role !== item.role) patch.role = role;
    if (Number(offset) !== item.dueOffsetDays)
      patch.dueOffsetDays = Number(offset);
    if (Object.keys(patch).length) onUpdate(item, patch);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="tmpl-row editing">
        <div className="seq">{item.sequence}</div>
        <input
          className="tt tmpl-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Task title"
          autoFocus
        />
        <select
          className="rl tmpl-input"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-label="Role"
        >
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          className="due tmpl-input"
          type="number"
          min="0"
          value={offset}
          onChange={(e) => setOffset(e.target.value)}
          aria-label="Due offset in days"
        />
        <div className="tmpl-actions">
          <button type="button" className="btn sm primary" onClick={save}>
            Save
          </button>
          <button
            type="button"
            className="btn sm ghost"
            onClick={() => {
              setTitle(item.title);
              setRole(item.role);
              setOffset(item.dueOffsetDays);
              setEditing(false);
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`tmpl-row${dragging ? " dragging" : ""}`}
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      onDragOver={(e) => onDragOver(e, item)}
      onDrop={(e) => onDrop(e, item)}
    >
      <div className="seq">{item.sequence}</div>
      <div className="tt">{item.title}</div>
      <div className="rl">
        <span className="badge role">{ROLE_LABELS[item.role]}</span>
      </div>
      <div className="due">+{item.dueOffsetDays}d</div>
      <div className="tmpl-actions">
        <button
          type="button"
          className="btn sm ghost"
          onClick={() => setEditing(true)}
        >
          Edit
        </button>
        <button
          type="button"
          className="btn sm ghost"
          onClick={() => onDelete(item)}
          aria-label={`Delete ${item.title}`}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
