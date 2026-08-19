import { STAGE_ORDER, STAGE_LABELS } from "../lib/format.js";
import { deriveStatus, isAlarm } from "../lib/taskStatus.js";

const STAGE_COLORS = {
  lead: "var(--stage-lead)",
  discovery: "var(--stage-discovery)",
  proposal: "var(--stage-proposal)",
  signed: "var(--stage-signed)",
  mapping: "var(--stage-mapping)",
  data_load: "var(--stage-dataload)",
  training: "var(--stage-training)",
  live: "var(--stage-live)",
};

export default function CustomerAnchor({ customers, tasks }) {
  const pipelineCustomers = customers.filter((customer) =>
    STAGE_ORDER.includes(customer.stage)
  );
  const total = pipelineCustomers.length;
  const live = pipelineCustomers.filter((customer) => customer.stage === "live").length;
  const active = total - live;
  const onboarding = pipelineCustomers.filter((customer) =>
    ["mapping", "data_load", "training"].includes(customer.stage)
  ).length;
  const attentionIds = new Set(
    tasks
      .filter((task) => task.customerId && isAlarm(deriveStatus(task)))
      .map((task) => task.customerId)
  );

  return (
    <div className="anchor">
      <div>
        <div className="a-label">Book of Business</div>
        <div className="a-main">{total} communities</div>
        <div className="a-sub">one record, Lead through Live</div>
      </div>
      <div className="a-mid">
        <div className="anchor-summary">
          <span><b>{active}</b> in active pipeline</span>
          <span>{live} live</span>
        </div>
        <div className="a-bar" aria-label="Customers by pipeline stage">
          {STAGE_ORDER.map((stage) => {
            const count = pipelineCustomers.filter(
              (customer) => customer.stage === stage
            ).length;
            return (
              <i
                key={stage}
                style={{
                  width: `${total ? (count / total) * 100 : 0}%`,
                  background: STAGE_COLORS[stage],
                }}
              />
            );
          })}
        </div>
        <div className="a-legend">
          {STAGE_ORDER.map((stage) => {
            const count = pipelineCustomers.filter(
              (customer) => customer.stage === stage
            ).length;
            return (
              <span key={stage}>
                <i style={{ background: STAGE_COLORS[stage] }} />
                {STAGE_LABELS[stage]} {count}
              </span>
            );
          })}
        </div>
      </div>
      <div className="a-stats">
        <div className="a-stat accent"><b>{onboarding}</b><span>Onboarding</span></div>
        <div className="a-stat warn"><b>{attentionIds.size}</b><span>Attention</span></div>
      </div>
    </div>
  );
}