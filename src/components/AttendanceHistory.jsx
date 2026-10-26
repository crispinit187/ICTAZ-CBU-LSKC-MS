import React, { useEffect, useState } from "react";
import { Chip, T, card, td, th } from "./admin/ui.jsx";
import { live } from "../lib/api.js";

const SAMPLE = {
  scope: "term",
  term: { name: "Semester 1" },
  present: 3,
  excused: 0,
  absent: 1,
  percent: 75,
  rows: [
    {
      id: "a",
      title: "Cloud basics",
      session_date: "2026-10-14",
      start_at: "2026-10-14T16:00:00Z",
      status: "Present",
      method: "QR",
    },
    {
      id: "b",
      title: "Git workshop",
      session_date: "2026-10-07",
      start_at: "2026-10-07T16:00:00Z",
      status: "Absent",
    },
  ],
};

const day = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const CHIP = { Present: "Active", Excused: "Pending", Absent: "Rejected" };
const HOW = { QR: "Scanned", Manual: "Marked by a Registrar" };

/* A member's attended, excused and missed sessions with a term / all time switch.
   `load(scope)` resolves { data } or { error }. */
export default function AttendanceHistory({ load, title = "My attendance" }) {
  const [scope, setScope] = useState("term");
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    setD(null);
    setErr("");
    if (!live()) return setD(SAMPLE);
    let on = true;
    load(scope).then((r) => {
      if (!on) return;
      if (r.error) setErr(r.error);
      else setD(r.data);
    });
    return () => {
      on = false;
    };
  }, [scope, load]);

  const stat = (label, value, color) => (
    <div style={{ minWidth: 90 }}>
      <div style={{ fontSize: 28, fontWeight: "bold", color: color || "#fff" }}>
        {value}
      </div>
      <div style={{ color: T.dim, fontSize: 12, letterSpacing: 1 }}>
        {label.toUpperCase()}
      </div>
    </div>
  );
  return (
    <section aria-label={title} style={{ ...card }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
        <div
          role="group"
          aria-label="Period"
          style={{ display: "flex", gap: 6 }}
        >
          {[
            ["term", d && d.term ? d.term.name : "This term"],
            ["all", "All time"],
          ].map(([k, l]) => (
            <button
              key={k}
              type="button"
              aria-pressed={scope === k}
              onClick={() => setScope(k)}
              style={{
                padding: "7px 14px",
                borderRadius: 20,
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: "bold",
                cursor: "pointer",
                color: "#fff",
                border: "1px solid " + (scope === k ? T.blue : "#333"),
                background:
                  scope === k ? "rgba(0,102,255,0.25)" : "transparent",
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      {err && (
        <div style={{ marginTop: 12, color: T.red, fontSize: 14 }}>{err}</div>
      )}
      {!d && !err && (
        <div style={{ marginTop: 12, color: T.dim }}>Loading...</div>
      )}
      {d && (
        <>
          <div
            style={{
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
              margin: "16px 0",
            }}
          >
            {stat("Attended", d.present, T.green)}
            {stat("Missed", d.absent, d.absent ? T.red : undefined)}
            {d.excused > 0 && stat("Excused", d.excused, T.amber)}
            {stat("Attendance", d.percent == null ? "–" : d.percent + "%")}
          </div>
          {d.rows.length === 0 ? (
            <div style={{ color: T.muted, fontSize: 14 }}>
              No closed sessions in this period yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Session</th>
                    <th style={th}>Date</th>
                    <th style={th}>Result</th>
                    <th style={th}>How</th>
                  </tr>
                </thead>
                <tbody>
                  {d.rows.map((r) => (
                    <tr key={r.id}>
                      <td style={td}>
                        {r.title}
                        {r.venue ? (
                          <span style={{ color: T.dim }}> · {r.venue}</span>
                        ) : null}
                      </td>
                      <td style={td}>{day(r.start_at)}</td>
                      <td style={td}>
                        <Chip status={CHIP[r.status]}>{r.status}</Chip>
                      </td>
                      <td style={{ ...td, color: T.muted }}>
                        {HOW[r.method] || ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
