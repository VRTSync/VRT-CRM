import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import {
  formatMoney,
  formatDate,
  STAGE_LABELS,
} from "../lib/format.js";
import { useOpenCustomer } from "../lib/openCustomer.js";
import FactRow from "../components/FactRow.jsx";
import PropertyChips from "../components/PropertyChips.jsx";
import Stepper from "../components/Stepper.jsx";
import Tabs from "../components/Tabs.jsx";
import NoteComposer from "../components/NoteComposer.jsx";
import Timeline from "../components/Timeline.jsx";
import ContactsTable from "../components/ContactsTable.jsx";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "communication", label: "Communication" },
  { id: "contacts", label: "Contacts" },
  { id: "todo", label: "To-Do" },
  { id: "documents", label: "Documents" },
];

const COMM_FILTERS = [
  { id: "all", label: "All", kinds: null },
  { id: "call", label: "Calls", kinds: ["call"] },
  { id: "email", label: "Emails", kinds: ["email"] },
  { id: "meeting", label: "Meetings", kinds: ["meeting"] },
  { id: "site_visit", label: "Site visits", kinds: ["site_visit"] },
];

export default function CustomerRecord() {
  const { id } = useParams();
  const customerId = Number(id);
  const { setOpenCustomer } = useOpenCustomer();
  const [customer, setCustomer] = useState(null);
  const [notes, setNotes] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [owners, setOwners] = useState({});
  const [tab, setTab] = useState("overview");
  const [commFilter, setCommFilter] = useState("all");

  function loadNotes() {
    api.notes(customerId).then(setNotes);
  }

  useEffect(() => {
    setTab("overview");
    setCommFilter("all");
    api.customer(customerId).then((c) => {
      setCustomer(c);
      setOpenCustomer({ id: c.id, name: c.name });
    });
    api.contacts(customerId).then(setContacts);
    api.users().then((users) => {
      setOwners(Object.fromEntries(users.map((u) => [u.id, u.name])));
    });
    loadNotes();
    return () => setOpenCustomer(null);
  }, [customerId]);

  if (!customer) return null;

  const keyContacts = contacts.filter((c) => c.contactType !== "contractor");
  const contractors = contacts.filter((c) => c.contactType === "contractor");

  const activeFilter = COMM_FILTERS.find((f) => f.id === commFilter);
  const filteredNotes = activeFilter.kinds
    ? notes.filter((n) => activeFilter.kinds.includes(n.kind))
    : notes;

  return (
    <>
      <div className="cust-head">
        {/* Header per spec 3.5: seven elements in order. */}
        <div className="ch-top">
          <div>
            <h1>{customer.name}</h1>
            <div className="ch-badges">
              <span className="badge accent">{STAGE_LABELS[customer.stage]}</span>
              {/* Element 3, alarm state. Alarms derive from tasks, which
                  arrive in a later slice. The position stays in the markup. */}
              <span className="ch-alarm" />
            </div>
          </div>
          <div className="ch-money">
            <b>{formatMoney(customer.annualValue)}</b>
            <span>
              annual value
              {customer.termYears ? `, ${customer.termYears} year term` : ""}
            </span>
          </div>
        </div>
        <FactRow
          facts={[
            { label: "Units", value: customer.unitCount },
            {
              label: "Acreage",
              value: customer.acreage ? `${Number(customer.acreage)} ac` : "",
            },
            { label: "Management Co.", value: customer.managementCompany },
            {
              label: "Assigned Manager",
              value:
                (contacts.find((c) => c.contactType === "manager") || {}).name ||
                "",
            },
            { label: "Internal Owner", value: owners[customer.ownerUserId] || "" },
            { label: "Created", value: formatDate(customer.createdAt) },
          ]}
        />
        <PropertyChips layers={customer.layers} />
        <Stepper
          stage={customer.stage}
          stageEnteredAt={customer.stageEnteredAt}
        />
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === "overview" && (
        <div className="g-2-1">
          <div className="stack">
            <NoteComposer customerId={customerId} onSaved={loadNotes} />
            <div className="card k-warn">
              <div className="card-head">
                <h2>Stage Checklist, {STAGE_LABELS[customer.stage]}</h2>
              </div>
              <div className="card-body">
                <p className="hint">
                  No checklist items yet. Stage checklists arrive with task
                  templates.
                </p>
              </div>
              <div className="card-foot">
                You can advance with items still open. You will be asked why,
                and the open items follow the customer forward.
              </div>
            </div>
          </div>
          <div className="stack">
            <div className="card">
              <div className="card-head">
                <h2>Key Contacts</h2>
              </div>
              <div className="card-body flush">
                {keyContacts.length === 0 && (
                  <div className="row">
                    <div className="grow r-meta">No contacts yet.</div>
                  </div>
                )}
                {keyContacts.map((c) => (
                  <div className="row" key={c.id}>
                    <div className="grow">
                      <div className="r-title">{c.name}</div>
                      <div className="r-meta">
                        {c.title}
                        {c.organization && <span className="sep">/</span>}
                        {c.organization}
                      </div>
                    </div>
                    {c.isPrimary && (
                      <div className="trail">
                        <span className="badge accent">Primary</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-head">
                <h2>Contractors on Site</h2>
              </div>
              <div className="card-body flush">
                {contractors.length === 0 && (
                  <div className="row">
                    <div className="grow r-meta">No contractors yet.</div>
                  </div>
                )}
                {contractors.map((c) => (
                  <div className="row" key={c.id}>
                    <div className="grow">
                      <div className="r-title">{c.name}</div>
                      <div className="r-meta">
                        {c.title}
                        {c.organization && <span className="sep">/</span>}
                        {c.organization}
                      </div>
                    </div>
                    <div className="trail">
                      <span className="badge role">Contractor</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "communication" && (
        <div className="card">
          <div className="card-head">
            <h2>Communication</h2>
            <div className="trail">
              <div className="chips">
                {COMM_FILTERS.map((f) => {
                  const count = f.kinds
                    ? notes.filter((n) => f.kinds.includes(n.kind)).length
                    : notes.length;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      className={`chip${commFilter === f.id ? " active" : ""}`}
                      onClick={() => setCommFilter(f.id)}
                      aria-pressed={commFilter === f.id}
                    >
                      {f.label} <span className="n">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="card-body flush">
            <Timeline notes={filteredNotes} />
          </div>
        </div>
      )}

      {tab === "contacts" && (
        <div className="card">
          <div className="card-head">
            <h2>Contacts</h2>
          </div>
          <div className="card-body flush">
            <ContactsTable contacts={contacts} />
          </div>
        </div>
      )}

      {tab === "todo" && (
        <div className="stack">
          <div className="card">
            <div className="card-head">
              <h2>Open</h2>
              <div className="trail">
                <span className="hint">0 tasks</span>
              </div>
            </div>
            <div className="card-body">
              <p className="hint">No open tasks. Tasks arrive in a later slice.</p>
            </div>
          </div>
          <div className="card">
            <div className="card-head">
              <h2>Completed</h2>
              <div className="trail">
                <span className="hint">0 tasks</span>
              </div>
            </div>
            <div className="card-body">
              <p className="hint">No completed tasks yet.</p>
            </div>
          </div>
        </div>
      )}

      {tab === "documents" && (
        <div className="card">
          <div className="card-head">
            <h2>Documents</h2>
          </div>
          <div className="card-body flush">
            <table>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Type</th>
                  <th>Added by</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} className="t-sub">
                    No documents yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="card-foot">
            Documents follow the customer into the VRTSync platform after
            onboarding.
          </div>
        </div>
      )}
    </>
  );
}
