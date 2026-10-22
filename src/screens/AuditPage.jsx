import React, { useCallback, useEffect, useState } from "react";
import AdminShell from "../components/admin/AdminShell.jsx";
import {
  Btn,
  Notice,
  T,
  card,
  input,
  td,
  th,
} from "../components/admin/ui.jsx";
import { actionText, live, rpc } from "../lib/api.js";

const PAGE = 50;
const when = (iso) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AuditPage() {
  const [q, setQ] = useState("");
  const [mod, setMod] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [off, setOff] = useState(0);
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(null);
  const load = useCallback(async () => {
    if (!live()) return setErr("Connect the database to see the audit log.");
    const r = await rpc("list_audit", {
      p_search: q || null,
      p_module: mod || null,
      p_from: from || null,
      p_to: to || null,
      p_limit: PAGE,
      p_offset: off,
    });
    if (r.error) setErr(r.error);
    else {
      setErr("");
      setD(r.data);
    }
  }, [q, mod, from, to, off]);
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);
  const reset = (fn) => (e) => {
    fn(e.target.value);
    setOff(0);
  };
  const rows = d ? d.rows : [];
  return (
    <AdminShell
      active="audit"
      title="Audit log"
      subtitle="Every sensitive action, who did it and when. Entries cannot be edited or removed."
    >
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <input
          aria-label="Search"
          placeholder="Search action, person or reason"
          style={{ ...input, flex: "1 1 260px" }}
          value={q}
          onChange={reset(setQ)}
        />
        <select
          aria-label="Area"
          style={input}
          value={mod}
          onChange={reset(setMod)}
        >
          <option value="">All areas</option>
          {(d ? d.modules : []).map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <input
          aria-label="From date"
          type="date"
          style={input}
          value={from}
          onChange={reset(setFrom)}
        />
        <input
          aria-label="To date"
          type="date"
          style={input}
          value={to}
          onChange={reset(setTo)}
        />
      </div>
      {err && <Notice tone="error">{err}</Notice>}
      <section style={{ ...card, padding: 8, overflowX: "auto" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}
        >
          <thead>
            <tr>
              {["WHEN", "ACTION", "BY", "ABOUT", "REASON", ""].map((h) => (
                <th key={h} style={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <React.Fragment key={r.id}>
                <tr>
                  <td style={td}>{when(r.at)}</td>
                  <td style={td}>{actionText(r.action)}</td>
                  <td style={td}>
                    {r.actor || "System"}
                    {r.actor_role ? (
                      <span style={{ color: T.dim }}> · {r.actor_role}</span>
                    ) : null}
                  </td>
                  <td style={td}>{r.target || ""}</td>
                  <td style={td}>{r.reason || ""}</td>
                  <td style={td}>
                    {(r.before || r.after) && (
                      <Btn
                        onClick={() => setOpen(open === r.id ? null : r.id)}
                        style={{ padding: "5px 10px", fontSize: 12 }}
                      >
                        {open === r.id ? "Hide" : "Details"}
                      </Btn>
                    )}
                  </td>
                </tr>
                {open === r.id && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ ...td, background: "rgba(255,255,255,0.03)" }}
                    >
                      <pre
                        style={{
                          margin: 0,
                          whiteSpace: "pre-wrap",
                          color: T.muted,
                          fontSize: 13,
                          fontFamily: "inherit",
                        }}
                      >
                        {"Before: " +
                          JSON.stringify(r.before || {}, null, 1) +
                          "\nAfter: " +
                          JSON.stringify(r.after || {}, null, 1)}
                      </pre>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {d && !rows.length && (
              <tr>
                <td colSpan={6} style={{ ...td, color: T.dim }}>
                  No entries match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
      {d && (
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            color: T.muted,
            fontSize: 14,
          }}
        >
          <Btn
            disabled={off === 0}
            onClick={() => setOff(Math.max(0, off - PAGE))}
          >
            Previous
          </Btn>
          <span>
            {d.total
              ? off +
                1 +
                " to " +
                Math.min(d.total, off + PAGE) +
                " of " +
                d.total
              : "0 entries"}
          </span>
          <Btn
            disabled={off + PAGE >= d.total}
            onClick={() => setOff(off + PAGE)}
          >
            Next
          </Btn>
        </div>
      )}
    </AdminShell>
  );
}
