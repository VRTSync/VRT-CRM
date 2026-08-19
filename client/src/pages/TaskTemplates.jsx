import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { STAGE_LABELS } from "../lib/format.js";
import TemplateRow from "../components/TemplateRow.jsx";
import ConfirmDelete from "../components/ConfirmDelete.jsx";
import Avatar from "../components/Avatar.jsx";

const ROLE_LABELS = { sales: "Sales", mapping: "Mapping", admin: "Admin" };

function triggerLabel(template) {
  if (template.triggerStage) {
    return `Stage = ${STAGE_LABELS[template.triggerStage]}`;
  }
  if (template.name === "Annual Renewal") return "90 days before renewal";
  return "Manual apply";
}

// Task Templates screen per spec 7.6. Layout g-1-2: template list on the
// left, editor on the right, footer band explaining role assignment.
export default function TaskTemplates() {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [users, setUsers] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState({ title: "", role: "sales", offset: 1 });
  const [confirmItem, setConfirmItem] = useState(null);
  const [dragId, setDragId] = useState(null);

  function loadList() {
    return api.getTemplates().then((list) => {
      setTemplates(list);
      return list;
    });
  }

  function loadSelected(id) {
    api.getTemplate(id).then(setSelected);
  }

  useEffect(() => {
    loadList().then((list) => {
      if (list.length) loadSelected(list[0].id);
    });
    api.users().then((list) => setUsers(list.filter((u) => u.isActive)));
  }, []);

  function refresh() {
    loadList();
    if (selected) loadSelected(selected.id);
  }

  async function updateItem(item, patch) {
    await api.updateTemplateItem(item.id, patch);
    refresh();
  }

  async function confirmDelete() {
    await api.deleteTemplateItem(confirmItem.id, true);
    setConfirmItem(null);
    refresh();
  }

  async function addRow(e) {
    e.preventDefault();
    if (!newRow.title.trim()) return;
    await api.addTemplateItem(selected.id, {
      title: newRow.title.trim(),
      role: newRow.role,
      dueOffsetDays: Number(newRow.offset),
    });
    setNewRow({ title: "", role: "sales", offset: 1 });
    setAdding(false);
    refresh();
  }

  // Drag to reorder writes the new sequence for every affected row.
  function onDragStart(e, item) {
    setDragId(item.id);
    e.dataTransfer.effectAllowed = "move";
  }
  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }
  async function onDrop(e, target) {
    e.preventDefault();
    if (dragId === null || dragId === target.id) return;
    const items = selected.items.slice();
    const fromIdx = items.findIndex((i) => i.id === dragId);
    const toIdx = items.findIndex((i) => i.id === target.id);
    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);
    setDragId(null);
    // Optimistic reorder, then write sequences for rows that changed.
    setSelected({
      ...selected,
      items: items.map((it, i) => ({ ...it, sequence: i + 1 })),
    });
    await Promise.all(
      items.map((it, i) =>
        it.sequence === i + 1
          ? null
          : api.updateTemplateItem(it.id, { sequence: i + 1 })
      )
    );
    refresh();
  }

  const holders = (role) => users.filter((u) => u.role === role);

  return (
    <div className="g-1-2">
      <div className="card">
        <div className="card-head">
          <h2>Templates</h2>
        </div>
        <div className="card-body flush">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`list-item li-btn${selected && selected.id === t.id ? " active" : ""}`}
              onClick={() => loadSelected(t.id)}
            >
              <div>
                <div className="li-name">{t.name}</div>
                <div className="li-meta">
                  {t.itemCount} {t.itemCount === 1 ? "task" : "tasks"}
                  <span className="sep">&middot;</span>
                  {triggerLabel(t)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="card">
          <div className="card-head">
            <h2>{selected.name}</h2>
            <div className="trail">
              <span className="badge info">{triggerLabel(selected)}</span>
              <button
                type="button"
                className="btn sm"
                onClick={() => setAdding((v) => !v)}
              >
                + Add Row
              </button>
            </div>
          </div>
          <div className="card-body flush">
            <div className="tmpl-col-head">
              <div className="seq">#</div>
              <div className="tt">Task</div>
              <div className="rl">Role</div>
              <div className="due">Due</div>
              <div className="tmpl-actions" />
            </div>
            {adding && (
              <form className="tmpl-row editing" onSubmit={addRow}>
                <div className="seq">{selected.items.length + 1}</div>
                <input
                  className="tt tmpl-input"
                  value={newRow.title}
                  onChange={(e) =>
                    setNewRow({ ...newRow, title: e.target.value })
                  }
                  placeholder="Task title"
                  aria-label="New task title"
                  autoFocus
                />
                <select
                  className="rl tmpl-input"
                  value={newRow.role}
                  onChange={(e) => setNewRow({ ...newRow, role: e.target.value })}
                  aria-label="New task role"
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
                  value={newRow.offset}
                  onChange={(e) =>
                    setNewRow({ ...newRow, offset: e.target.value })
                  }
                  aria-label="New task due offset"
                />
                <div className="tmpl-actions">
                  <button type="submit" className="btn sm primary">
                    Add
                  </button>
                  <button
                    type="button"
                    className="btn sm ghost"
                    onClick={() => setAdding(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            {selected.items.map((item) => (
              <TemplateRow
                key={item.id}
                item={item}
                onUpdate={updateItem}
                onDelete={setConfirmItem}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                dragging={dragId === item.id}
              />
            ))}
          </div>
          <div className="card-foot">
            <div className="tmpl-foot-note">
              Tasks are assigned by role. The customer owner takes the task if
              they hold the role, otherwise the sole active holder of that
              role, otherwise it lands in Unassigned.
            </div>
            <div className="roles-band">
              {Object.entries(ROLE_LABELS).map(([role, label]) => (
                <div className="role-grp" key={role}>
                  <span className="badge role">{label}</span>
                  <span className="rg-avs">
                    {holders(role).length ? (
                      holders(role).map((u) => <Avatar key={u.id} user={u} />)
                    ) : (
                      <Avatar user={null} />
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {confirmItem && (
        <ConfirmDelete
          title="Delete template row"
          message={`Delete "${confirmItem.title}" from ${selected.name}? Future stage changes will no longer create this task.`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmItem(null)}
        />
      )}
    </div>
  );
}
