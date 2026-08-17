export default function Topbar({ title, subtitle, action }) {
  return (
    <div className="topbar">
      <div>
        <h1>{title}</h1>
        <div className="crumb">{subtitle}</div>
      </div>
      <div className="spacer"></div>
      <div className="search">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5L14 14" />
        </svg>{" "}
        Search customers, contacts, notes
      </div>
      <button className="btn primary" type="button">
        {action}
      </button>
    </div>
  );
}
