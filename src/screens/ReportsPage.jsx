import React, { useEffect, useState } from "react";
import AdminShell from "../components/admin/AdminShell.jsx";
import { Btn, Notice, T, card, input } from "../components/admin/ui.jsx";
import { can, useAuth } from "../auth/AuthProvider.jsx";
import { live, rpc } from "../lib/api.js";
import { downloadCsv } from "../lib/csv.js";

const ATT = [
  { key: "title", label: "Session" },
  { key: "session_date", label: "Date" },
  { key: "venue", label: "Venue" },
  { key: "student_number", label: "Student number" },
  { key: "name", label: "Name" },
  { key: "program", label: "Programme" },
  { key: "year", label: "Year" },
  { key: "semester", label: "Semester" },
  { key: "status", label: "Status" },
  { key: "method", label: "Method" },
  { key: "marked_at", label: "Marked at" },
  { key: "reason", label: "Reason" },
];
const MEM = [
  { key: "name", label: "Name" },
  { key: "student_number", label: "Student number" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "program", label: "Programme" },
  { key: "year", label: "Year" },
  { key: "semester", label: "Semester" },
  { key: "status", label: "Status" },
  { key: "role", label: "Role" },
  { key: "created_at", label: "Registered" },
];
const stamp = () => new Date().toISOString().slice(0, 10);

export default function ReportsPage() {
  const auth = useAuth();
  const [sems, setSems] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sem, setSem] = useState("");
  const [ses, setSes] = useState("");
  const [status, setStatus] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const canMembers = can(auth.ctx, "member.edit_details");
  useEffect(() => {
    if (!live()) return;
    rpc("list_semesters").then((r) => !r.error && setSems(r.data || []));
    rpc("list_sessions", { p_status: null, p_limit: 100, p_offset: 0 }).then(
      (r) => {
        if (!r.error) setSessions((r.data && r.data.rows) || r.data || []);
      },
    );
  }, []);
  const run = async (fn, args, name, cols) => {
    setBusy(true);
    setMsg(null);
    const r = await rpc(fn, args);
    setBusy(false);
    if (r.error) return setMsg({ tone: "error", text: r.error });
    downloadCsv(name + "-" + stamp() + ".csv", r.data || [], cols);
    setMsg({
      tone: "ok",
      text:
        (r.data || []).length +
        " rows downloaded. This export has been recorded in the audit log.",
    });
  };
  return (
    <AdminShell
      active="reports"
      title="Reports and exports"
      subtitle="Files open in Excel. Every export is recorded in the audit log."
    >
      {msg && (
        <Notice tone={msg.tone} sig={msg}>
          {msg.text}
        </Notice>
      )}
      {!live() && (
        <Notice tone="warn">Connect the database to export data.</Notice>
      )}
      <section style={card}>
        <h2 style={{ margin: "0 0 6px", fontSize: 18 }}>Attendance</h2>
        <p style={{ margin: "0 0 16px", color: T.muted, fontSize: 14 }}>
          One row per member per session, including excused and voided entries.
        </p>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <select
            aria-label="Semester"
            style={input}
            value={sem}
            onChange={(e) => setSem(e.target.value)}
          >
            <option value="">All semesters</option>
            {sems.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Session"
            style={input}
            value={ses}
            onChange={(e) => setSes(e.target.value)}
          >
            <option value="">All sessions</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <Btn
            kind="primary"
            disabled={busy || !live()}
            onClick={() =>
              run(
                "export_attendance",
                { p_semester: sem || null, p_session: ses || null },
                "attendance",
                ATT,
              )
            }
          >
            Download attendance
          </Btn>
        </div>
      </section>
      {canMembers && (
        <section style={card}>
          <h2 style={{ margin: "0 0 6px", fontSize: 18 }}>Members</h2>
          <p style={{ margin: "0 0 16px", color: T.muted, fontSize: 14 }}>
            Contains personal details. Share it only with people who need it.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <select
              aria-label="Status"
              style={input}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {["Active", "Pending", "Suspended", "Deactivated"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <Btn
              kind="primary"
              disabled={busy || !live()}
              onClick={() =>
                run(
                  "export_members",
                  { p_status: status || null },
                  "members",
                  MEM,
                )
              }
            >
              Download members
            </Btn>
          </div>
        </section>
      )}
    </AdminShell>
  );
}
