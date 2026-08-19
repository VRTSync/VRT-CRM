import { useState } from "react";
import { api } from "../lib/api.js";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_ORDER,
} from "../lib/format.js";

export default function ProjectComposer({
  currentUser,
  customers,
  users,
  onSaved,
  onCancel,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [leadUserId, setLeadUserId] = useState(String(currentUser.id));
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState("backlog");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const project = await api.createProject({
        name: name.trim(),
        description: description.trim() || null,
        customerId: customerId ? Number(customerId) : null,
        leadUserId: Number(leadUserId),
        targetDate: targetDate || null,
        status,
      });
      onSaved(project);
    } catch (err) {
      setError(err.message || "Could not create the project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card k-accent project-form" onSubmit={submit}>
      <div className="card-head">
        <h2>New Project</h2>
      </div>
      <div className="card-body">
        <div className="project-form-grid">
          <label className="project-field project-field-wide">
            <span>Project name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              autoFocus
            />
          </label>
          <label className="project-field project-field-wide">
            <span>Description</span>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="One-line project description"
            />
          </label>
          <label className="project-field">
            <span>Customer</span>
            <select
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
            >
              <option value="">Internal, no customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>
          <label className="project-field">
            <span>Project lead</span>
            <select
              value={leadUserId}
              onChange={(event) => setLeadUserId(event.target.value)}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <label className="project-field">
            <span>Target date</span>
            <input
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
            />
          </label>
          <label className="project-field">
            <span>Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {PROJECT_STATUS_ORDER.map((option) => (
                <option key={option} value={option}>
                  {PROJECT_STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <div className="deal-error" role="alert">{error}</div>}
        <div className="project-form-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn primary"
            disabled={!name.trim() || saving}
          >
            {saving ? "Creating..." : "Create project"}
          </button>
        </div>
      </div>
    </form>
  );
}