import Avatar from "./Avatar.jsx";

export default function TeamLoad({ members }) {
  return (
    <aside className="card">
      <div className="card-head">
        <h2>Team Load</h2>
      </div>
      <div className="card-body flush">
        {members.length === 0 ? (
          <div className="empty">No active team members.</div>
        ) : (
          members.map((member) => (
            <div className="row" key={member.id ?? "unassigned"}>
              <Avatar user={member.id === null ? null : member} />
              <div className="grow">
                <div className="r-title">{member.name}</div>
                <div className="r-meta">{member.roleLabel}</div>
              </div>
              <div className="trail">
                {member.overdueTasks > 0 && (
                  <span className="badge alarm">{member.overdueTasks} overdue</span>
                )}
                <span className="badge">{member.openTasks} open</span>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}