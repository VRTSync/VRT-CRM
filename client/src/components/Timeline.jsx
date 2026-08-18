import { formatDateTime } from "../lib/format.js";

// Vertical timeline per spec 6.8. Body is never truncated here;
// truncation is permitted in the Dashboard activity feed only.
const KIND_META = {
  call: { className: "k-call", label: "Call", badge: "info" },
  email: { className: "k-email", label: "Email", badge: "alt" },
  meeting: { className: "k-meeting", label: "Meeting", badge: "warn" },
  site_visit: { className: "k-visit", label: "Site visit", badge: "accent" },
  note: { className: "k-note", label: "Note", badge: "" },
  system: { className: "k-system", label: "Stage change", badge: "" },
};

export default function Timeline({ notes }) {
  if (!notes.length) {
    return <div className="card-body hint">No entries yet.</div>;
  }
  return (
    <div className="timeline">
      {notes.map((note) => {
        const meta = KIND_META[note.kind] || KIND_META.note;
        return (
          <div className={`tl-item ${meta.className}`} key={note.id}>
            <div className="tl-head">
              <span className="tl-who">
                {note.kind === "system" ? "System" : note.authorName}
              </span>
              <span className={`badge${meta.badge ? ` ${meta.badge}` : ""}`}>
                {meta.label}
              </span>
              <span className="tl-when">{formatDateTime(note.occurredAt)}</span>
            </div>
            <div className="tl-body">{note.body}</div>
          </div>
        );
      })}
    </div>
  );
}
