import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { STAGE_ORDER, STAGE_LABELS } from "../lib/format.js";
import { api } from "../lib/api.js";
import DealCard from "./DealCard.jsx";
import StageChangeDialog from "./StageChangeDialog.jsx";

const LIVE_CARD_LIMIT = 3;
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

function getProgress(customer, templateByStage, tasksByCustomer) {
  if (STAGE_ORDER.indexOf(customer.stage) < STAGE_ORDER.indexOf("signed")) {
    return null;
  }
  const itemIds = templateByStage[customer.stage] || [];
  if (!itemIds.length) return null;
  const itemIdSet = new Set(itemIds);
  const matching = (tasksByCustomer[customer.id] || []).filter(
    (task) => task.templateItemId && itemIdSet.has(task.templateItemId)
  );
  const done = matching.filter((task) => task.status === "done").length;
  return {
    done,
    total: itemIds.length,
    percent: Math.round((done / itemIds.length) * 100),
  };
}

export default function PipelineBoard({
  customers,
  setCustomers,
  owners,
  templates,
  tasks,
  onMoved,
}) {
  const navigate = useNavigate();
  const [draggedId, setDraggedId] = useState(null);
  const [move, setMove] = useState(null);
  const [cardErrors, setCardErrors] = useState({});

  const templateByStage = useMemo(
    () =>
      Object.fromEntries(
        templates
          .filter((template) => template.triggerStage && template.isActive)
          .map((template) => [
            template.triggerStage,
            template.items.filter((item) => item.isActive).map((item) => item.id),
          ])
      ),
    [templates]
  );
  const tasksByCustomer = useMemo(() => {
    const grouped = {};
    tasks.forEach((task) => {
      if (!task.customerId) return;
      grouped[task.customerId] = grouped[task.customerId] || [];
      grouped[task.customerId].push(task);
    });
    return grouped;
  }, [tasks]);

  function requestMove(customer, toStage) {
    if (customer.stage === toStage) return;
    setCardErrors((current) => ({ ...current, [customer.id]: "" }));
    setMove({ customer, toStage, originalStage: customer.stage });
  }

  function restoreMove(err) {
    if (!move) return;
    const customerId = move.customer.id;
    const originalStage = move.originalStage;
    setCustomers((current) =>
      current.map((customer) =>
        customer.id === customerId
          ? { ...customer, stage: originalStage }
          : customer
      )
    );
    setCardErrors((current) => ({
      ...current,
      [customerId]: err.message,
    }));
    setMove(null);
    api
      .customer(customerId)
      .then((authoritative) => {
        setCustomers((current) =>
          current.map((customer) =>
            customer.id === customerId
              ? { ...customer, ...authoritative }
              : customer
          )
        );
      })
      .catch(() => {});
  }

  return (
    <>
      <div className="board" aria-label="Customer pipeline board">
        {STAGE_ORDER.map((stage) => {
          const stageCustomers = customers.filter(
            (customer) => customer.stage === stage
          );
          const visible =
            stage === "live"
              ? stageCustomers.slice(0, LIVE_CARD_LIMIT)
              : stageCustomers;
          const overflow = stageCustomers.length - visible.length;
          return (
            <section
              className="col"
              key={stage}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const id = draggedId || Number(event.dataTransfer.getData("text/plain"));
                const customer = customers.find((item) => item.id === id);
                setDraggedId(null);
                if (customer) requestMove(customer, stage);
              }}
            >
              <div className="col-head">
                <span className="sdot" style={{ background: STAGE_COLORS[stage] }} />
                <span className="cn">{STAGE_LABELS[stage]}</span>
                <span className="cc">{stageCustomers.length}</span>
              </div>
              {visible.map((customer) => (
                <DealCard
                  key={customer.id}
                  customer={customer}
                  owner={owners[customer.ownerUserId] || null}
                  progress={getProgress(customer, templateByStage, tasksByCustomer)}
                  error={cardErrors[customer.id]}
                  onOpen={(id) => navigate(`/customers/${id}`)}
                  onDragStart={(event, draggedCustomer) => {
                    setDraggedId(draggedCustomer.id);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", String(draggedCustomer.id));
                  }}
                />
              ))}
              {overflow > 0 && <div className="col-more">{overflow} more</div>}
            </section>
          );
        })}
      </div>
      {move && (
        <StageChangeDialog
          customer={move.customer}
          toStage={move.toStage}
          onCancel={() => setMove(null)}
          onOptimistic={() => {
            setCustomers((current) =>
              current.map((customer) =>
                customer.id === move.customer.id
                  ? { ...customer, stage: move.toStage }
                  : customer
              )
            );
          }}
          onChanged={(updated) => {
            setCustomers((current) =>
              current.map((customer) =>
                customer.id === updated.id ? { ...customer, ...updated } : customer
              )
            );
            setMove(null);
            onMoved?.();
          }}
          onFailed={restoreMove}
        />
      )}
    </>
  );
}