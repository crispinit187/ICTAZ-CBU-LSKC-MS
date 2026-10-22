import React, { useEffect, useState } from "react";
import AdminShell from "../components/admin/AdminShell.jsx";
import { Notice, T, card, input } from "../components/admin/ui.jsx";
import { live, rpc } from "../lib/api.js";

const tone = (r) =>
  r >= 80 ? T.green : r >= 60 ? T.light : r >= 40 ? T.amber : T.red;

function Bars({ rows, label, empty }) {
  if (!rows.length) return <p style={{ color: T.dim, margin: 0 }}>{empty}</p>;
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {rows.map((r) => (
        <div key={label(r)}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 14,
              gap: 12,
            }}
          >
            <span>{label(r)}</span>
            <span style={{ color: T.muted }}>
              {r.rate}%
              {r.members !== undefined ? " · " + r.members + " members" : ""}
              {r.present !== undefined && r.members === undefined
                ? " · " + r.present + " present"
                : ""}
            </span>
          </div>
          <div
            style={{
              marginTop: 6,
              height: 10,
              borderRadius: 6,
              background: "rgba(255,255,255,0.07)",
            }}
          >
            <div
              style={{
                width: Math.min(100, r.rate) + "%",
                height: "100%",
                borderRadius: 6,
                background: tone(r.rate),
              }}
              role="img"
              aria-label={label(r) + " " + r.rate + " percent"}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Tile({ label, value, hint }) {
  return (
    <div style={{ ...card, flex: "1 1 180px" }}>
      <div
        style={{
          color: T.dim,
          fontSize: 12,
          letterSpacing: 1.5,
          fontWeight: "bold",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: "bold", marginTop: 8 }}>
        {value}
      </div>
      {hint && (
        <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>{hint}</div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [sem, setSem] = useState("");
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!live()) {
      setErr("Connect the database to see attendance analytics.");
      return undefined;
    }
    let on = true;
    rpc("analytics_overview", { p_semester: sem || null }).then((r) => {
      if (!on) return;
      if (r.error) setErr(r.error);
      else {
        setErr("");
        setD(r.data);
      }
    });
    return () => {
      on = false;
    };
  }, [sem]);
  const bands = d ? d.bands : {};
  return (
    <AdminShell
      active="analytics"
      title="Analytics"
      subtitle="Attendance rate is members present divided by active members, leaving out those excused."
      actions={
        d && (
          <select
            aria-label="Semester"
            style={input}
            value={sem || (d.semester ? d.semester.id : "")}
            onChange={(e) => setSem(e.target.value)}
          >
            {d.semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )
      }
    >
      {err && <Notice tone="error">{err}</Notice>}
      {d && (
        <>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Tile label="ACTIVE MEMBERS" value={d.active_members} />
            <Tile
              label="SESSIONS HELD"
              value={d.sessions_count}
              hint={d.semester ? d.semester.name : "No current semester"}
            />
            <Tile label="AVERAGE ATTENDANCE" value={d.average_rate + "%"} />
          </div>
          <section style={card}>
            <h2 style={{ margin: "0 0 16px", fontSize: 18 }}>
              Attendance by session
            </h2>
            <Bars
              rows={d.sessions}
              label={(r) => r.title + " · " + r.date_label}
              empty="No sessions have been held in this semester yet."
            />
          </section>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <section style={{ ...card, flex: "1 1 320px" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: 18 }}>By programme</h2>
              <Bars
                rows={d.programs}
                label={(r) => r.name}
                empty="No programme data yet."
              />
            </section>
            <section style={{ ...card, flex: "1 1 320px" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: 18 }}>
                By year of study
              </h2>
              <Bars
                rows={d.years}
                label={(r) => "Year " + r.year}
                empty="No year data yet."
              />
            </section>
          </div>
          <section style={card}>
            <h2 style={{ margin: "0 0 16px", fontSize: 18 }}>
              Members by attendance
            </h2>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {[
                ["80% and above", bands.high, T.green],
                ["60 to 79%", bands.good, T.light],
                ["40 to 59%", bands.fair, T.amber],
                ["Below 40%", bands.low, T.red],
              ].map(([l, n, c]) => (
                <div
                  key={l}
                  style={{
                    flex: "1 1 140px",
                    padding: 14,
                    borderRadius: 12,
                    border: "1px solid " + T.line,
                  }}
                >
                  <div style={{ fontSize: 26, fontWeight: "bold", color: c }}>
                    {n || 0}
                  </div>
                  <div style={{ color: T.muted, fontSize: 13 }}>{l}</div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </AdminShell>
  );
}
