import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_ORDER,
} from "../lib/format.js";
import DealCard from "./DealCard.jsx";

const STATUS_COLORS = {
  backlog: "var(--muted)",
  in_progress: "var(--info)",
  blocked: "var(--alarm)",
  done: "var(--good)",
};

export default function ProjectBoard({
  projects,
  setProjects,
  owners,
  tasks,
}) {
  const navigate = useNavigate();
  const [draggedId, setDraggedId] = useState(null);
  const [cardErrors, setCardErrors] = useState({});

  const progressByProject = useMemo(() => {
    const grouped = {};
    tasks.forEach((task) => {
      if (!task.projectId) return;
      grouped[task.projectId] = grouped[task.projectId] || [];
      grouped[task.projectId].push(task);
    });
    return Object.fromEntries(
      Object.entries(grouped).map(([projectId, rows]) => {
        const done = rows.filter((task) => task.status === "done").length;
        return [
          projectId,
          {
            done,
            total: rows.length,
            percent: Math.round((done / rows.length) * 100),
          },
        ];
      })
    );
  }, [tasks]);

  async function moveProject(project, status) {
    if (project.status === status) return;
    const originalStatus = project.status;
    setCardErrors((current) => ({ ...current, [project.id]: "" }));
    setProjects((current) =>
      current.map((item) =>
        item.id === project.id ? { ...item, status } : item
      )
    );
    try {
      const updated = await api.updateProject(project.id, { status });
      setProjects((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      setProjects((current) =>
        current.map((item) =>
          item.id === project.id ? { ...item, status: originalStatus } : item
        )
      );
      setCardErrors((current) => ({
        ...current,
        [project.id]: err.message || "Could not update project status",
      }));
    }
  }

  return (
    <div className="board project-board" aria-label="Projects board">
      {PROJECT_STATUS_ORDER.map((status) => {
        const rows = projects.filter((project) => project.status === status);
        return (
          <section
            className="col"
            key={status}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const id =
                draggedId || Number(event.dataTransfer.getData("text/plain"));
              const project = projects.find((item) => item.id === id);
              setDraggedId(null);
              if (project) moveProject(project, status);
            }}
          >
            <div className="col-head">
              <span
                className="sdot"
                style={{ background: STATUS_COLORS[status] }}
              />
              <span className="cn">{PROJECT_STATUS_LABELS[status]}</span>
              <span className="cc">{rows.length}</span>
            </div>
            {rows.map((project) => (
              <DealCard
                key={project.id}
                project={project}
                owner={owners[project.leadUserId] || null}
                progress={progressByProject[project.id] || null}
                error={cardErrors[project.id]}
                onOpen={(id) => navigate(`/projects/${id}`)}
                onStatusChange={moveProject}
                onDragStart={(event, draggedProject) => {
                  setDraggedId(draggedProject.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData(
                    "text/plain",
                    String(draggedProject.id)
                  );
                }}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}