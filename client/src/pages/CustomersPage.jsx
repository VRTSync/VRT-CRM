import { useEffect, useState } from "react";
import Shell from "../components/Shell.jsx";
import CustomerAnchor from "../components/CustomerAnchor.jsx";
import PipelineBoard from "../components/PipelineBoard.jsx";
import CustomersList from "./CustomersList.jsx";
import { api } from "../lib/api.js";

function viewStorageKey(userId) {
  return `vrtsync-customers-view:${userId}`;
}

export default function CustomersPage({ user }) {
  const [view, setView] = useState(() => {
    const saved = localStorage.getItem(viewStorageKey(user.id));
    return saved === "list" ? "list" : "board";
  });
  const [customers, setCustomers] = useState(null);
  const [owners, setOwners] = useState({});
  const [templates, setTemplates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem(viewStorageKey(user.id), view);
  }, [user.id, view]);

  useEffect(() => {
    let active = true;
    Promise.all([api.customers(), api.users(), api.getTemplates(), api.getTasks()])
      .then(async ([customerRows, users, templateRows, taskRows]) => {
        const activeStageTemplates = templateRows.filter(
          (template) => template.triggerStage && template.isActive
        );
        const fullTemplates = await Promise.all(
          activeStageTemplates.map((template) => api.getTemplate(template.id))
        );
        if (!active) return;
        setCustomers(customerRows);
        setOwners(Object.fromEntries(users.map((owner) => [owner.id, owner])));
        setTemplates(fullTemplates);
        setTasks(taskRows);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  function refreshPipelineData() {
    Promise.all([api.customers(), api.getTasks()])
      .then(([customerRows, taskRows]) => {
        setCustomers(customerRows);
        setTasks(taskRows);
      })
      .catch((err) => setError(err.message));
  }

  const ownerNames = Object.fromEntries(
    Object.entries(owners).map(([id, owner]) => [id, owner.name])
  );

  return (
    <Shell
      user={user}
      title="Customers"
      subtitle="All communities and the active pipeline"
      action="+ New Customer"
      topbarExtra={
        <div className="chips" aria-label="Customer view">
          {["board", "list"].map((option) => (
            <button
              key={option}
              type="button"
              className={`chip${view === option ? " active" : ""}`}
              onClick={() => setView(option)}
              aria-pressed={view === option}
            >
              {option === "board" ? "Board" : "List"}
            </button>
          ))}
        </div>
      }
    >
      {customers && <CustomerAnchor customers={customers} tasks={tasks} />}
      <div className="callout">
        <svg className="ci" width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="8" cy="8" r="6.5" />
          <path d="M8 7.2v4M8 4.9v.1" />
        </svg>
        <div>
          Sales and onboarding are <b>one continuous pipeline</b>, not two systems.
          A community keeps the same record from Lead through Live.
        </div>
      </div>
      {error && <div className="deal-error" role="alert">{error}</div>}
      {customers && view === "board" && (
        <PipelineBoard
          customers={customers}
          setCustomers={setCustomers}
          owners={owners}
          templates={templates}
          tasks={tasks}
          onMoved={refreshPipelineData}
        />
      )}
      {customers && view === "list" && (
        <CustomersList rows={customers} owners={ownerNames} />
      )}
    </Shell>
  );
}