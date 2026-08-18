import { useState } from "react";
import { api } from "../lib/api.js";

// Note composer per spec 6.10. Writes the five user kinds only.
// The sixth kind, system, belongs to the stage change engine.
const KINDS = [
  { id: "call", label: "Call" },
  { id: "email", label: "Email" },
  { id: "meeting", label: "Meeting" },
  { id: "site_visit", label: "Site visit" },
  { id: "note", label: "Note" },
];

export default function NoteComposer({ customerId, onSaved }) {
  const [body, setBody] = useState("");
  const [kind, setKind] = useState("note");
  const [focused, setFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const expanded = focused || body.length > 0;

  async function save() {
    if (!body.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      await api.createNote({ customerId, kind, body });
      setBody("");
      if (onSaved) onSaved();
    } catch (err) {
      setError(err.message || "Could not save the note");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="composer">
      <textarea
        className="ta"
        placeholder="Log a note..."
        value={body}
        rows={expanded ? 4 : 2}
        onChange={(e) => setBody(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          border: "none",
          resize: "vertical",
          font: "inherit",
          outline: "none",
          background: "transparent",
          color: "var(--ink-2)",
        }}
      />
      <div className="c-actions">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            className={`chip${kind === k.id ? " active" : ""}`}
            onClick={() => setKind(k.id)}
            aria-pressed={kind === k.id}
          >
            {k.label}
          </button>
        ))}
        {error && <span className="hint">{error}</span>}
        <button
          type="button"
          className="btn primary sm"
          onClick={save}
          disabled={!body.trim() || saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
