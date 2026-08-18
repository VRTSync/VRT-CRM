import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { formatDate, STAGE_LABELS } from "../lib/format.js";

const COLUMNS = [
  { key: "name", label: "Community" },
  { key: "managementCompany", label: "Management Co." },
  { key: "unitCount", label: "Units", numeric: true },
  { key: "stage", label: "Stage" },
  { key: "ownerName", label: "Owner" },
  { key: "lastContact", label: "Last Contact" },
  { key: "nextStep", label: "Next Step" },
];

const STAGE_BADGES = {
  lead: "",
  discovery: "info",
  proposal: "alt",
  signed: "warn",
  mapping: "accent",
  data_load: "accent",
  training: "good",
  live: "solid",
  churned: "",
};

export default function CustomersList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [owners, setOwners] = useState({});
  const [sort, setSort] = useState({ key: "name", dir: 1 });

  useEffect(() => {
    api.customers().then(setRows);
    api.users().then((users) => {
      setOwners(Object.fromEntries(users.map((u) => [u.id, u.name])));
    });
  }, []);

  const sorted = useMemo(() => {
    if (!rows) return null;
    const withOwner = rows.map((r) => ({
      ...r,
      ownerName: owners[r.ownerUserId] || "",
    }));
    const { key, dir } = sort;
    return withOwner.sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, owners, sort]);

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: 1 }));
  }

  if (!sorted) return null;

  return (
    <div className="card">
      <div className="card-head">
        <h2>All Customers</h2>
        <div className="trail">
          <span className="hint">{sorted.length} communities</span>
        </div>
      </div>
      <div className="card-body flush">
        <table>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`sortable${col.numeric ? " num" : ""}`}
                  aria-sort={
                    sort.key === col.key
                      ? sort.dir === 1
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    type="button"
                    className="th-sort"
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr
                key={c.id}
                className="row-link"
                tabIndex={0}
                role="link"
                aria-label={`Open ${c.name}`}
                onClick={() => navigate(`/customers/${c.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/customers/${c.id}`);
                  }
                }}
              >
                <td className="t-strong">{c.name}</td>
                <td>{c.managementCompany}</td>
                <td className="num">{c.unitCount}</td>
                <td>
                  <span
                    className={`badge${STAGE_BADGES[c.stage] ? ` ${STAGE_BADGES[c.stage]}` : ""}`}
                  >
                    {STAGE_LABELS[c.stage]}
                  </span>
                </td>
                <td>{c.ownerName}</td>
                <td>{c.lastContact ? formatDate(c.lastContact) : ""}</td>
                <td>{c.nextStep || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
