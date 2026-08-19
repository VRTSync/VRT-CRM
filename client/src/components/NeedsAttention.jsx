const BADGE_KIND = {
  stale: "warn",
  blocked: "alarm",
  slow: "warn",
};

export default function NeedsAttention({ attention }) {
  const items = attention?.all || [];
  return (
    <aside className="card k-warn">
      <div className="card-head">
        <h2>Needs Attention</h2>
        <div className="trail">
          <span className="badge warn">{items.length}</span>
        </div>
      </div>
      <div className="card-body flush">
        {items.length === 0 ? (
          <div className="empty">All clear. No customer signals need attention.</div>
        ) : (
          items.map((item, index) => (
            <div className="row" key={`${item.kind}-${item.customerId}-${index}`}>
              <div className="grow">
                <div className="r-title">{item.customerName}</div>
                <div className="r-meta">{item.explanation}</div>
              </div>
              <div className="trail">
                <span className={`badge ${BADGE_KIND[item.kind]}`}>{item.label}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}