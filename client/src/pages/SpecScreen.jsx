import TokenSwatch from "../components/TokenSwatch.jsx";

const surfaceTokens = [
  "--bg",
  "--card",
  "--surface-sunk",
  "--surface-alt",
  "--chrome-bg",
  "--chrome-bg-2",
];

const accentTokens = [
  "--accent",
  "--accent-2",
  "--accent-soft",
  "--accent-ink",
  "--alarm",
  "--alarm-soft",
  "--alarm-ink",
  "--warn",
  "--warn-soft",
  "--warn-ink",
  "--info",
  "--info-soft",
  "--info-ink",
  "--alt",
  "--alt-soft",
  "--alt-ink",
  "--good",
  "--good-soft",
  "--good-ink",
];

const stageTokens = [
  ["Lead", "--stage-lead"],
  ["Discovery", "--stage-discovery"],
  ["Proposal", "--stage-proposal"],
  ["Signed", "--stage-signed"],
  ["Mapping", "--stage-mapping"],
  ["Data Load", "--stage-dataload"],
  ["Training", "--stage-training"],
  ["Live", "--stage-live"],
];

const typeTokens = [
  ["Display", "--fs-display"],
  ["Heading 1", "--fs-h1"],
  ["Heading 2", "--fs-h2"],
  ["Heading 3", "--fs-h3"],
  ["Body", "--fs-body"],
  ["Small", "--fs-sm"],
  ["Extra small", "--fs-xs"],
  ["2x small", "--fs-2xs"],
  ["3x small", "--fs-3xs"],
];

const spaceTokens = [
  "--sp-1",
  "--sp-2",
  "--sp-3",
  "--sp-4",
  "--sp-5",
  "--sp-6",
  "--sp-7",
  "--sp-8",
  "--sp-9",
];

const tables = [
  {
    name: "users",
    columns: [
      ["id"],
      ["google_sub"],
      ["email"],
      ["name"],
      ["avatar_url", true],
      ["role", true],
      ["is_active"],
      ["created_at"],
    ],
  },
  {
    name: "customers",
    columns: [
      ["id"],
      ["name"],
      ["management_company", true],
      ["is_self_managed"],
      ["unit_count", true],
      ["acreage", true],
      ["fully_maintained"],
      ["stage"],
      ["stage_entered_at"],
      ["owner_user_id", true],
      ["vrtsync_map_url", true],
      ["term_years", true],
      ["renewal_date", true],
      ["source", true],
      ["status", true],
      ["created_at"],
    ],
  },
  {
    name: "customer_layers",
    columns: [
      ["id"],
      ["customer_id"],
      ["layer"],
      ["in_scope"],
      ["annual_price", true],
      ["notes", true],
      ["created_at"],
    ],
    explanation:
      "Customer layers hold scope and price only. Nothing is measurable until maps are drawn, so quantities live in the VRTSync platform rather than this CRM.",
  },
  {
    name: "contacts",
    columns: [
      ["id"],
      ["customer_id"],
      ["name"],
      ["title", true],
      ["organization", true],
      ["email", true],
      ["phone", true],
      ["contact_type"],
      ["is_primary"],
      ["notes", true],
    ],
  },
  {
    name: "notes",
    columns: [
      ["id"],
      ["customer_id", true],
      ["project_id", true],
      ["author_user_id"],
      ["kind"],
      ["body"],
      ["occurred_at"],
      ["created_at"],
      ["from_stage", true],
      ["to_stage", true],
    ],
    explanation:
      "Notes are the full stage history. Every stage change writes one note with both stage columns set, and there is no separate stage-history table. A note has exactly one parent: a customer or a project.",
  },
  {
    name: "tasks",
    columns: [
      ["id"],
      ["title"],
      ["description", true],
      ["customer_id", true],
      ["project_id", true],
      ["role", true],
      ["assignee_user_id", true],
      ["due_date", true],
      ["status"],
      ["source"],
      ["template_item_id", true],
      ["completed_at", true],
      ["created_at"],
    ],
    explanation:
      "A task may have a customer, a project, or neither, but never both. Neither is a real internal-work state.",
  },
  {
    name: "task_templates",
    columns: [
      ["id"],
      ["name"],
      ["trigger_stage", true],
      ["is_active"],
    ],
  },
  {
    name: "template_items",
    columns: [
      ["id"],
      ["template_id"],
      ["sequence"],
      ["title"],
      ["role"],
      ["due_offset_days"],
      ["is_active"],
    ],
  },
  {
    name: "projects",
    columns: [
      ["id"],
      ["name"],
      ["description", true],
      ["status"],
      ["customer_id", true],
      ["lead_user_id"],
      ["target_date", true],
      ["created_at"],
    ],
  },
];

const forwardSteps = [
  "Write one note with kind = system, from_stage and to_stage set, and body holding either the typed reason for a backward move or skip-ahead, or a generated sentence for an ordinary forward move.",
  "Set stage_entered_at to now.",
  "If the move is backward, run the backward-move rules, then stop. Templates do not fire on backward moves.",
  "Look up an active template whose trigger_stage matches the new stage.",
  "For each template item that does not already have a task on this customer, in any status, create one. Set due_date to today plus due_offset_days, source to template, and template_item_id.",
  "Resolve the assignee in this order: the customer owner if they hold the item's role, the sole active holder of that role, and otherwise leave assignee_user_id null so the task lands in Unassigned.",
];

const backwardRules = [
  "Delete open tasks belonging to the stage being abandoned. These are template-sourced tasks whose template_item_id maps to the template for from_stage and whose status is open or blocked.",
  "Keep completed tasks. They are the record of work actually done and remain in the customer's To-Do history.",
  "Never delete manually created tasks, whatever stage they were created during. Only template-sourced tasks are in scope.",
  "Mark the abandoned stages as behind for stepper rendering. This is derived from note history, not stored.",
];

function TokenGroup({ title, tokens, className = "" }) {
  return (
    <section className={`spec-token-group ${className}`}>
      <h3>{title}</h3>
      <div className="token-grid">
        {tokens.map((token) => (
          <TokenSwatch key={token} token={token} />
        ))}
      </div>
    </section>
  );
}

function DataModelTable({ table }) {
  return (
    <section className="model-table">
      <h3>
        <code>{table.name}</code>
      </h3>
      <table>
        <thead>
          <tr>
            <th scope="col">Column</th>
            <th scope="col">Nullability</th>
          </tr>
        </thead>
        <tbody>
          {table.columns.map(([column, nullable]) => (
            <tr key={column}>
              <td>
                <code>{column}</code>
              </td>
              <td>{nullable ? "nullable" : "required"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {table.explanation && <p className="model-note">{table.explanation}</p>}
    </section>
  );
}

export default function SpecScreen() {
  return (
    <>
      <section className="card">
        <div className="card-head">
          <h2>Tokens</h2>
        </div>
        <div className="card-body spec-body">
          <p>
            The live CSS custom properties used by the CRM. Labels stay beside
            their fills so token names remain readable independently of color.
          </p>
          <TokenGroup title="Surfaces and chrome" tokens={surfaceTokens} />
          <TokenGroup title="Accent and status" tokens={accentTokens} />
          <section className="spec-token-group">
            <h3>Pipeline stages</h3>
            <div className="token-grid">
              {stageTokens.map(([label, token]) => (
                <TokenSwatch key={token} label={label} token={token} />
              ))}
            </div>
          </section>
          <section className="spec-token-group">
            <h3>Type scale</h3>
            <div className="type-scale">
              {typeTokens.map(([label, token]) => (
                <div className="type-specimen" key={token}>
                  <span style={{ fontSize: `var(${token})` }}>{label}</span>
                  <code>{token}</code>
                </div>
              ))}
            </div>
          </section>
          <section className="spec-token-group">
            <h3>Spacing scale</h3>
            <div className="space-scale">
              {spaceTokens.map((token) => (
                <div className="space-specimen" key={token}>
                  <span
                    className="space-bar"
                    style={{ width: `var(${token})` }}
                    aria-hidden="true"
                  />
                  <code>{token}</code>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Data Model</h2>
        </div>
        <div className="card-body spec-body">
          <p>
            The nine tables below mirror the current database schema. Nullable
            markers are derived from the schema and are authoritative here.
          </p>
          <div className="model-tables">
            {tables.map((table) => (
              <DataModelTable key={table.name} table={table} />
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Automation</h2>
        </div>
        <div className="card-body spec-body">
          <p>
            Stage change is the only automation in v1. Every stage change
            happens in one transaction.
          </p>
          <h3>Any stage change</h3>
          <ol className="spec-list">
            {forwardSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="spec-callout">
            The deduplication check on template_item_id makes re-entering a
            stage safe. A customer who moves back and then forward again gets
            deleted tasks recreated with fresh due dates, while completed tasks
            are correctly skipped. This replaces the older rule that blocked a
            template from firing twice and removes the need to track stage
            history for automation purposes.
          </p>
          <h3>Backward moves</h3>
          <p>
            A move is backward when to_stage sits earlier in the fixed stage
            order than from_stage, at any distance.
          </p>
          <ol className="spec-list">
            {backwardRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
          <p className="spec-callout">
            Deleting an open task destroys no history, because open means
            nobody did the work. The reason note carries the why.
          </p>
        </div>
      </section>
    </>
  );
}