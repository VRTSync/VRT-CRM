import { NavLink } from "react-router-dom";
import Avatar from "./Avatar.jsx";

const ICONS = {
  dashboard: (
    <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  ),
  customers: (
    <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2 13V6l4-3 4 3v7M10 13V8l4 3v2" />
      <path d="M1 13h14" />
    </svg>
  ),
  team: (
    <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 8.5l2.5 2.5L13 4" />
    </svg>
  ),
  projects: (
    <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="3" width="12" height="10" rx="1.5" />
      <path d="M6 3v10M10 3v10" />
    </svg>
  ),
  templates: (
    <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M2 4h12M2 8h12M2 12h8" />
    </svg>
  ),
  spec: (
    <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3l2 1.5" />
    </svg>
  ),
};

const WORK_ITEMS = [
  { to: "/", icon: "dashboard", label: "Dashboard" },
  { to: "/customers", icon: "customers", label: "Customers" },
  { to: "/team", icon: "team", label: "Team To-Do" },
  { to: "/projects", icon: "projects", label: "Projects" },
];

const SETUP_ITEMS = [
  { to: "/templates", icon: "templates", label: "Task Templates" },
  { to: "/spec", icon: "spec", label: "Design Spec" },
];

function NavItems({ items }) {
  return (
    <nav className="nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) => (isActive ? "active" : undefined)}
        >
          {ICONS[item.icon]} {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Sidebar({ user }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">VS</div>
        <div>
          <div className="brand-name">
            VRT<em>Sync</em>
          </div>
          <div className="brand-sub">CRM</div>
        </div>
      </div>

      <div>
        <div className="nav-group-label">Work</div>
        <NavItems items={WORK_ITEMS} />
      </div>

      <div>
        <div className="nav-group-label">Setup</div>
        <NavItems items={SETUP_ITEMS} />
      </div>

      <div className="sidebar-foot">
        <div className="me">
          <Avatar user={user} />
          <div>
            <div className="me-name">{user.name}</div>
            <small>{roleLabel(user.role)}</small>
          </div>
        </div>
      </div>
    </aside>
  );
}

function roleLabel(role) {
  if (!role) return "No role yet";
  const labels = {
    sales: "Sales",
    mapping: "Mapping",
    admin: "Admin",
    owner: "Owner / Sales",
  };
  return labels[role] || role;
}
