import { useState } from "react";
import { api } from "../lib/api.js";
import Select from "./Select.jsx";

// Inline manual task form, no modal, no overlay. Used by Team To-Do and
// the customer To-Do tab. Always submits source=manual; no source field
// is exposed.
const ROLES = [
  { id: "", label: "No role" },
  { id: "sales", label: "Sales" },
  { id: "mapping", label: "Mapping" },
  { id: "admin", label: "Admin" },
];

export default function TaskComposer({
  customerId,
  projectId,
  customers = [],
  projects = [],
  users = [],
  onSaved,
  onCancel,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [context, setContext] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const assignable = users.filter((u) => u.role);
  const needsContext = customerId === undefined && projectId === undefined;

  async function save() {
    if (!title.trim() || saving || (needsContext && !context)) return;
    setSaving(true);
    setError(null);
    try {
      let selectedCustomerId = customerId;
      let selectedProjectId = projectId;
      if (needsContext) {
        const [type, id] = context.split(":");
        selectedCustomerId = type === "customer" ? Number(id) : undefined;
        selectedProjectId = type === "project" ? Number(id) : undefined;
      }
      await api.createTask({
        title: title.trim(),
        description: description.trim() || null,
        customerId: selectedCustomerId,
        projectId: selectedProjectId,
        role: role || null,
        assigneeUserId: assignee ? Number(assignee) : null,
        dueDate: dueDate || null,
      });
      setTitle("");
      setDescription("");
      setRole("");
      setAssignee("");
      setDueDate("");
      setContext("");
      if (onSaved) onSaved();
    } catch (err) {
      setError(err.message || "Could not save the task");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="composer task-composer">
      <div className="tc-fields">
        <input
          className="tc-input"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
          }}
        />
        <input
          className="tc-input"
          placeholder="Description, optional"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="c-actions">
        {needsContext && (
          <Select
            aria-label="Task context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
          >
            <option value="">Select customer or project</option>
            <optgroup label="Customers">
              {customers.map((customer) => (
                <option key={`customer-${customer.id}`} value={`customer:${customer.id}`}>
                  {customer.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Projects">
              {projects.map((project) => (
                <option key={`project-${project.id}`} value={`project:${project.id}`}>
                  {project.name}
                </option>
              ))}
            </optgroup>
          </Select>
        )}
        <Select
          aria-label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          {ROLES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Assignee"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
        >
          <option value="">Unassigned</option>
          {assignable.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </Select>
        <input
          className="tc-date"
          type="date"
          aria-label="Due date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        {error && <span className="hint">{error}</span>}
        {onCancel && (
          <button type="button" className="btn ghost sm" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          type="button"
          className="btn primary sm"
          onClick={save}
          disabled={!title.trim() || saving || (needsContext && !context)}
        >
          {saving ? "Saving..." : "Add task"}
        </button>
      </div>
    </div>
  );
}
