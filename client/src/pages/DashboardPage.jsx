import { useCallback, useEffect, useRef, useState } from "react";
import KpiTile from "../components/KpiTile.jsx";
import NeedsAttention from "../components/NeedsAttention.jsx";
import PipelineByStage from "../components/PipelineByStage.jsx";
import TaskRow from "../components/TaskRow.jsx";
import TeamLoad from "../components/TeamLoad.jsx";
import Timeline from "../components/Timeline.jsx";
import { api } from "../lib/api.js";

export default function DashboardPage() {
  const dashboardRequest = useRef(null);
  const [state, setState] = useState({
    loading: true,
    data: null,
    error: "",
  });

  const loadDashboard = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    dashboardRequest.current = api.dashboard();
    return dashboardRequest.current
      .then((data) => setState({ loading: false, data, error: "" }))
      .catch((err) =>
        setState({
          loading: false,
          data: null,
          error: err.message || "Could not load the dashboard.",
        })
      );
  }, []);

  useEffect(() => {
    let active = true;
    if (!dashboardRequest.current) {
      dashboardRequest.current = api.dashboard();
    }
    dashboardRequest.current
      .then((data) => {
        if (active) setState({ loading: false, data, error: "" });
      })
      .catch((err) => {
        if (active) {
          setState({
            loading: false,
            data: null,
            error: err.message || "Could not load the dashboard.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (state.loading) {
    return <div className="empty" aria-live="polite">Loading dashboard...</div>;
  }

  if (state.error || !state.data) {
    return (
      <div className="deal-error" role="alert">
        {state.error || "Could not load the dashboard."}{" "}
        <button className="btn sm" type="button" onClick={loadDashboard}>
          Try again
        </button>
      </div>
    );
  }

  const { kpis, myTodo, recentActivity, pipeline, attention, teamLoad } = state.data;
  const todoAlarm = kpis.myOverdueTasks > 0;

  return (
    <>
      <div className="g-4">
        <KpiTile
          label="Active Pipeline"
          value={kpis.activePipeline}
          sublabel="communities, Lead through Signed"
        />
        <KpiTile
          label="Onboarding"
          value={kpis.onboarding}
          sublabel="Mapping, Data Load, Training"
          kind="accent"
        />
        <KpiTile
          label="Live Communities"
          value={kpis.live}
          sublabel="in service"
          kind="good"
        />
        <KpiTile
          label="My Open Tasks"
          value={kpis.myOpenTasks}
          sublabel={
            todoAlarm
              ? `${kpis.myOverdueTasks} overdue`
              : "No overdue work"
          }
          kind={todoAlarm ? "alarm" : "info"}
        />
      </div>

      <div className="g-2-1">
        <div className="stack">
          <section className={`card${todoAlarm ? " k-alarm" : ""}`}>
            <div className="card-head">
              <h2>My To-Do</h2>
              <div className="trail">
                {todoAlarm ? (
                  <span className="badge alarm">
                    <i /> {kpis.myOverdueTasks} overdue
                  </span>
                ) : (
                  <span className="hint">{kpis.myOpenTasks} open</span>
                )}
              </div>
            </div>
            <div className="card-body flush">
              {myTodo.length === 0 ? (
                <div className="empty">No tasks assigned to you.</div>
              ) : (
                myTodo.map((task) => <TaskRow key={task.id} task={task} />)
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Recent Activity</h2>
              <div className="trail">
                <span className="hint">last 10 entries, all customers</span>
              </div>
            </div>
            <div className="card-body flush">
              <Timeline notes={recentActivity} clampBody />
            </div>
          </section>
        </div>

        <div className="stack">
          <PipelineByStage stages={pipeline} />
          <NeedsAttention attention={attention} />
          <TeamLoad members={teamLoad} />
        </div>
      </div>
    </>
  );
}