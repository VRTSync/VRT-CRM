import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Shell from "./components/Shell.jsx";
import { api } from "./lib/api.js";

const SCREENS = [
  {
    path: "/",
    title: "Dashboard",
    subtitle: "Today across the company",
    action: "+ New Customer",
  },
  {
    path: "/customers",
    title: "Customers",
    subtitle: "All communities and the active pipeline",
    action: "+ New Customer",
  },
  {
    path: "/team",
    title: "Team To-Do",
    subtitle: "Open tasks across the company",
    action: "+ Add Task",
  },
  {
    path: "/projects",
    title: "Projects",
    subtitle: "Internal work not tied to one customer",
    action: "+ New Project",
  },
  {
    path: "/templates",
    title: "Task Templates",
    subtitle: "Reusable checklists by stage",
    action: "+ New Template",
  },
  {
    path: "/spec",
    title: "Design Spec",
    subtitle: "VRTSync brand system as applied to the CRM",
    action: "+ New Customer",
  },
];

function LoginScreen({ error }) {
  const messages = {
    domain:
      "That Google account is not part of the company workspace. Sign in with your company account.",
    oauth: "Sign in did not complete. Try again.",
    inactive: "This account has been deactivated. Contact the owner.",
  };
  return (
    <div className="shell" style={{ gridTemplateColumns: "1fr" }}>
      <main className="main">
        <div className="content stack" style={{ margin: "0 auto", paddingTop: "80px", maxWidth: "420px" }}>
          <div className="card">
            <div className="card-head">
              <h2>VRTSync CRM</h2>
            </div>
            <div className="card-body stack">
              {error && <p style={{ color: "var(--alarm-ink)" }}>{messages[error] || messages.oauth}</p>}
              <p style={{ color: "var(--muted)" }}>Sign in with your company Google account to continue.</p>
              <a className="btn primary" href="/auth/google" style={{ justifyContent: "center" }}>
                Sign in with Google
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState({ loading: true, user: null });

  useEffect(() => {
    api
      .me()
      .then((user) => setState({ loading: false, user }))
      .catch(() => setState({ loading: false, user: null }));
  }, []);

  if (state.loading) {
    return null;
  }

  if (!state.user) {
    const params = new URLSearchParams(window.location.search);
    return <LoginScreen error={params.get("error")} />;
  }

  return (
    <Routes>
      {SCREENS.map((screen) => (
        <Route
          key={screen.path}
          path={screen.path === "/" ? "/" : screen.path}
          element={
            <Shell
              user={state.user}
              title={screen.title}
              subtitle={screen.subtitle}
              action={screen.action}
            />
          }
        />
      ))}
      <Route
        path="*"
        element={
          <Shell
            user={state.user}
            title="Dashboard"
            subtitle="Today across the company"
            action="+ New Customer"
          />
        }
      />
    </Routes>
  );
}
