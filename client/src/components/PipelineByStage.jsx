export default function PipelineByStage({ stages }) {
  return (
    <aside className="card k-info">
      <div className="card-head">
        <h2>Pipeline by Stage</h2>
      </div>
      <div className="card-body flush">
        {stages.map((stage) => (
          <div className="row" key={stage.stage}>
            <span className={`sdot stage-${stage.stage}`} aria-hidden="true" />
            <div className="grow">
              <div className="r-title">{stage.label}</div>
            </div>
            <div className="trail">
              <span className="badge" aria-label={`${stage.count} communities`}>
                {stage.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}