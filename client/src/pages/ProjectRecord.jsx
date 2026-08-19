import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Shell from "../components/Shell.jsx";
import FactRow from "../components/FactRow.jsx";
import NoteComposer from "../components/NoteComposer.jsx";
import TaskComposer from "../components/TaskComposer.jsx";
import TaskRow from "../components/TaskRow.jsx";
import Timeline from "../components/Timeline.jsx";
import { api } from "../lib/api.js";
import {
  formatDate,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_ORDER,
} from "../lib/format.js";
import Select from "../components/Select.jsx";

export default function ProjectRecord({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const projectId = Number(id);
  const [project, setProject] = useState(null);
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [addingTask, setAddingTask] = useState(false);
  const [error, setError] = useState("");

  function loadNotes() {
    return api.projectNotes(projectId).then(setNotes);
  }

  function loadTasks() {
    return api.getTasks({ projectId }).then(setTasks);
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      api.project(projectId),
      api.projectNotes(projectId),
      api.getTasks({ projectId }),
      api.users(),
    ])
      .then(([projectRow, noteRows, taskRows, userRows]) => {
        if (!active) return;
        setProject(projectRow);
        setNotes(noteRows);
        setTasks(taskRows);
        setUsers(userRows);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  async function changeStatus(status) {
    if (!project || project.status === status) return;
    const original = project;
    setError("");
    setProject({ ...project, status });
    try {
      const updated = await api.updateProject(project.id, { status });
      setProject(updated);
    } catch (err) {
      setProject(original);
      setError(err.message || "Could not update project status");
    }
  }

  async function toggleTask(task, status) {
    try {
      await api.updateTask(task.id, { status });
      await loadTasks();
    } catch (err) {
      setError(err.message || "Could not update the task");
    }
  }

  if (!project) {
    return (
      <Shell
        user={user}
        title="Projects"
        subtitle="Project record"
        action="+ New Project"
        onAction={() => navigate("/projects?new=1")}
      >
        {error && <div className="deal-error" role="alert">{error}</div>}
      </Shell>
    );
  }

  const openTasks = tasks.filter((task) => task.status !== "done");
  const doneTasks = tasks.filter((task) => task.status === "done");
  const contextLabel = project.customerName || "Internal";

  return (
    <Shell
      user={user}
      title="Projects"
      subtitle="Project record"
      action="+ New Project"
      onAction={() => navigate("/projects?new=1")}
    >
      <div className="cust-head">
        <div className="ch-top">
          <div>
            <h1>{project.name}</h1>
            <div className="ch-badges">
              <span className="badge accent">
                {PROJECT_STATUS_LABELS[project.status]}
              </span>
              <span className={`badge${project.customerName ? " accent" : ""}`}>
                {contextLabel}
              </span>
            </div>
          </div>
          <div className="ch-trail">
            <label className="stage-select">
              <span className="ss-label">Project status</span>
              <Select
                value={project.status}
                onChange={(event) => changeStatus(event.target.value)}
              >
                {PROJECT_STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {PROJECT_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </label>
          </div>
        </div>
        <FactRow
          facts={[
            { label: "Lead", value: project.leadName },
            {
              label: "Status",
              value: PROJECT_STATUS_LABELS[project.status],
            },
            { label: "Target Date", value: formatDate(project.targetDate) },
            { label: "Customer", value: contextLabel },
            { label: "Created", value: formatDate(project.createdAt) },
          ]}
        />
      </div>

      {error && <div className="deal-error" role="alert">{error}</div>}

      <div className="g-2-1">
        <div className="stack">
          <NoteComposer projectId={projectId} onSaved={loadNotes} />

          <div className="card k-warn">
            <div className="card-head">
              <h2>Project Checklist</h2>
              <div className="trail">
                <span className="hint">
                  {openTasks.length} open, {doneTasks.length} completed
                </span>
                <button
                  type="button"
                  className="btn sm"
                  onClick={() => setAddingTask((current) => !current)}
                >
                  + Add Task
                </button>
              </div>
            </div>
            {addingTask && (
              <div className="card-body">
                <TaskComposer
                  projectId={projectId}
                  users={users}
                  onSaved={() => {
                    loadTasks();
                    setAddingTask(false);
                  }}
                  onCancel={() => setAddingTask(false)}
                />
              </div>
            )}
            <div className="card-body flush">
              {openTasks.length === 0 && (
                <div className="row">
                  <div className="grow r-meta">No open project tasks.</div>
                </div>
              )}
              {openTasks.map((task) => (
                <TaskRow key={task.id} task={task} onToggle={toggleTask} />
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Completed Tasks</h2>
              <div className="trail">
                <span className="hint">{doneTasks.length} completed</span>
              </div>
            </div>
            <div className="card-body flush">
              {doneTasks.length === 0 && (
                <div className="row">
                  <div className="grow r-meta">No completed tasks yet.</div>
                </div>
              )}
              {doneTasks.map((task) => (
                <TaskRow key={task.id} task={task} onToggle={toggleTask} />
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Project Timeline</h2>
            </div>
            <div className="card-body flush">
              <Timeline notes={notes} />
            </div>
          </div>
        </div>

        <aside className="card k-info">
          <div className="card-head">
            <h2>Field Reference</h2>
          </div>
          <div className="card-body flush">
            {[
              ["Description", project.description || "No description"],
              ["Project lead", project.leadName],
              ["Status", PROJECT_STATUS_LABELS[project.status]],
              ["Target date", formatDate(project.targetDate) || "Not set"],
              ["Customer", contextLabel],
              ["Created", formatDate(project.createdAt)],
            ].map(([label, value]) => (
              <div className="row project-reference-row" key={label}>
                <div className="grow">
                  <div className="f-label">{label}</div>
                  <div className="r-title">{value}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </Shell>
  );
}