import { useEffect, useMemo, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Shell from "./components/Shell.jsx";
import CustomersList from "./pages/CustomersList.jsx";
import CustomerRecord from "./pages/CustomerRecord.jsx";
import TeamTodo from "./pages/TeamTodo.jsx";
import { OpenCustomerContext } from "./lib/openCustomer.js";
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
    title: "Spec",
    subtitle: "VRTSync brand system as applied to the CRM",
    action: "+ New Customer",
  },
];

const GROUPINGS = [
  { id: "person", label: "Person" },
  { id: "customer", label: "Customer" },
  { id: "role", label: "Role" },
];

// Team To-Do owns two pieces of top-bar state: the grouping control and
// the "+ Add Task" action that opens the inline composer.
function TeamTodoScreen({ user }) {
  const [grouping, setGrouping] = useState("person");
  const [composerOpen, setComposerOpen] = useState(false);
  return (
    <Shell
      user={user}
      title="Team To-Do"
      subtitle="Open tasks across the company"
      action="+ Add Task"
      onAction={() => setComposerOpen((v) => !v)}
      topbarExtra={
        <div className="chips">
          {GROUPINGS.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`chip${grouping === g.id ? " active" : ""}`}
              onClick={() => setGrouping(g.id)}
              aria-pressed={grouping === g.id}
            >
              {g.label}
            </button>
          ))}
        </div>
      }
    >
      <TeamTodo
        grouping={grouping}
        composerOpen={composerOpen}
        onComposerClose={() => setComposerOpen(false)}
      />
    </Shell>
  );
}

function LoginScreen({ error }) {
  const messages = {
    domain:
      "That Google account is not part of the company workspace. Sign in with your company account.",
    oauth: "Sign in did not complete. Try again.",
    inactive: "This account has been deactivated. Contact the owner.",
  };
  return (
    <div className="login-shell">
      <main className="main">
        <div className="login-canvas content stack">
          <div className="card">
            <div className="card-head">
              <h2>VRTSync CRM</h2>
            </div>
            <div className="card-body stack">
              {error && <p className="login-error">{messages[error] || messages.oauth}</p>}
              <p className="login-hint">Sign in with your company Google account to continue.</p>
              <a className="btn primary login-btn" href="/auth/google">
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
  const [openCustomer, setOpenCustomer] = useState(null);
  const openCustomerValue = useMemo(
    () => ({ openCustomer, setOpenCustomer }),
    [openCustomer]
  );

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
    <OpenCustomerContext.Provider value={openCustomerValue}>
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
            >
              {screen.path === "/customers" && <CustomersList />}
            </Shell>
          }
        />
      ))}
      <Route path="/team" element={<TeamTodoScreen user={state.user} />} />
      <Route
        path="/customers/:id"
        element={
          <Shell
            user={state.user}
            title="Customers"
            subtitle="Customer record"
            action="+ New Customer"
          >
            <CustomerRecord />
          </Shell>
        }
      />
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
    </OpenCustomerContext.Provider>
  );
}
