import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Shell from "../components/Shell.jsx";
import ProjectBoard from "../components/ProjectBoard.jsx";
import ProjectComposer from "../components/ProjectComposer.jsx";
import { api } from "../lib/api.js";

export default function ProjectsPage({ user }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [owners, setOwners] = useState({});
  const [tasks, setTasks] = useState([]);
  const [creating, setCreating] = useState(
    () => searchParams.get("new") === "1"
  );
  const [error, setError] = useState("");

  function closeComposer() {
    setCreating(false);
    if (searchParams.has("new")) {
      setSearchParams({}, { replace: true });
    }
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      api.projects(),
      api.customers(),
      api.users(),
      api.getTasks(),
    ])
      .then(([projectRows, customerRows, userRows, taskRows]) => {
        if (!active) return;
        setProjects(projectRows);
        setCustomers(customerRows);
        setUsers(userRows);
        setOwners(Object.fromEntries(userRows.map((row) => [row.id, row])));
        setTasks(taskRows);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Shell
      user={user}
      title="Projects"
      subtitle="Customer-linked and internal work"
      action="+ New Project"
      onAction={() => setCreating((current) => !current)}
      wide
    >
      <div className="callout">
        <span className="ci">&#9432;</span>
        <span>
          Projects can be <b>linked to a customer</b> or kept{" "}
          <b>standalone for internal work</b>. Project status does not change a
          customer pipeline stage.
        </span>
      </div>
      {creating && (
        <ProjectComposer
          currentUser={user}
          customers={customers}
          users={users}
          onSaved={(project) => {
            setProjects((current) => [...(current || []), project]);
            closeComposer();
          }}
          onCancel={closeComposer}
        />
      )}
      {error && <div className="deal-error" role="alert">{error}</div>}
      {projects && (
        <ProjectBoard
          projects={projects}
          setProjects={setProjects}
          owners={owners}
          tasks={tasks}
        />
      )}
    </Shell>
  );
}