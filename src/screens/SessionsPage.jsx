import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminShell from "../components/admin/AdminShell.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import {
  Btn,
  Chip,
  Notice,
  T,
  card,
  input,
  td,
  th,
} from "../components/admin/ui.jsx";
import { can, useAuth } from "../auth/AuthProvider.jsx";
import { live, rpc } from "../lib/api.js";
import { fromLocalInput, toLocalInput, whenText } from "../lib/format.js";

const STATUS_CHIP = {
  Scheduled: "Pending",
  Open: "Active",
  Closed: "Deactivated",
  Cancelled: "Rejected",
};

function Field({ label, children }) {
  return (
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          marginBottom: 6,
          color: T.muted,
          fontSize: 13,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function SessionForm({ initial, onClose, onSaved }) {
  const editing = !!initial;
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const later = new Date(now.getTime() + 90 * 60000);
  const [f, setF] = useState({
    title: initial ? initial.title : "",
    description: initial ? initial.description || "" : "",
    venue: initial ? initial.venue || "" : "",
    start: toLocalInput(initial ? initial.start_at : now.toISOString()),
    end: toLocalInput(initial ? initial.end_at : later.toISOString()),
  });
  const [fac, setFac] = useState(initial ? initial.facilitators || [] : []);
  const [q, setQ] = useState("");
  const [found, setFound] = useState([]);
  const [guest, setGuest] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    if (q.trim().length < 2) return setFound([]);
    const t = setTimeout(async () => {
      const r = await rpc("list_members", {
        p_search: q,
        p_status: "Active",
        p_limit: 6,
        p_offset: 0,
      });
      setFound(r.error ? [] : r.data.rows);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!f.start || !f.end) return setErr("Choose a start and an end time.");
    setBusy(true);
    const args = {
      p_title: f.title,
      p_description: f.description,
      p_date: f.start.slice(0, 10),
      p_start: fromLocalInput(f.start),
      p_end: fromLocalInput(f.end),
      p_venue: f.venue,
      p_facilitators: fac.map((x) =>
        x.kind === "member"
          ? { kind: "member", member_id: x.member_id }
          : { kind: "guest", guest_name: x.name },
      ),
    };
    const r = editing
      ? await rpc("update_session", { p_id: initial.id, ...args })
      : await rpc("create_session", args);
    setBusy(false);
    if (r.error) return setErr(r.error);
    onSaved(
      editing
        ? "Session updated."
        : "Session created. Open it when the meeting starts.",
    );
  };

  return (
    <section style={{ ...card, maxWidth: 640 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>
          {editing ? "Edit session" : "Create a session"}
        </h2>
        <Btn onClick={onClose} style={{ padding: "6px 12px" }}>
          Close
        </Btn>
      </div>
      <form
        onSubmit={submit}
        style={{
          marginTop: 14,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {err && (
          <Notice tone="error" inline>
            {err}
          </Notice>
        )}
        <Field label="Title">
          <input
            required
            style={{ ...input, width: "100%" }}
            value={f.title}
            onChange={set("title")}
            placeholder="Weekly Chapter Meeting"
          />
        </Field>
        <Field label="Venue">
          <input
            style={{ ...input, width: "100%" }}
            value={f.venue}
            onChange={set("venue")}
          />
        </Field>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Field label="Starts">
            <input
              required
              type="datetime-local"
              style={input}
              value={f.start}
              onChange={set("start")}
            />
          </Field>
          <Field label="Ends">
            <input
              required
              type="datetime-local"
              style={input}
              value={f.end}
              onChange={set("end")}
            />
          </Field>
        </div>
        <Field label="Notes (optional)">
          <textarea
            rows={2}
            style={{ ...input, width: "100%", resize: "vertical" }}
            value={f.description}
            onChange={set("description")}
          />
        </Field>
        <div>
          <span
            style={{
              display: "block",
              marginBottom: 6,
              color: T.muted,
              fontSize: 13,
            }}
          >
            Facilitators
          </span>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 8,
            }}
          >
            {fac.map((x, i) => (
              <span
                key={i}
                style={{
                  padding: "5px 10px",
                  borderRadius: 20,
                  background: "rgba(0,102,255,0.14)",
                  border: "1px solid rgba(84,173,255,0.4)",
                  fontSize: 13,
                }}
              >
                {x.name} {x.kind === "guest" ? "(guest)" : ""}
                <button
                  type="button"
                  aria-label={"Remove " + x.name}
                  onClick={() => setFac(fac.filter((_, j) => j !== i))}
                  style={{
                    marginLeft: 8,
                    background: "none",
                    border: "none",
                    color: "#bcd6ff",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            style={{ ...input, width: "100%" }}
            placeholder="Add a member: type a name"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search members to add as facilitator"
          />
          {found.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                if (!fac.some((x) => x.member_id === m.id))
                  setFac([
                    ...fac,
                    { kind: "member", member_id: m.id, name: m.name },
                  ]);
                setQ("");
                setFound([]);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
                marginTop: 4,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#fff",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {m.name} · {m.student_number}
            </button>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              style={{ ...input, flex: 1, minWidth: 0 }}
              placeholder="Add a guest: type a name"
              value={guest}
              onChange={(e) => setGuest(e.target.value)}
              aria-label="Guest facilitator name"
            />
            <Btn
              disabled={!guest.trim()}
              onClick={() => {
                setFac([...fac, { kind: "guest", name: guest.trim() }]);
                setGuest("");
              }}
            >
              Add guest
            </Btn>
          </div>
        </div>
        <div>
          <Btn kind="primary" type="submit" disabled={busy}>
            {busy ? "Saving..." : editing ? "Save changes" : "Create session"}
          </Btn>
        </div>
      </form>
    </section>
  );
}

function Attendance({ id }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    rpc("session_attendance", { p_session: id }).then((r) =>
      setRows(r.error ? [] : r.data),
    );
  }, [id]);
  if (!rows) return <p style={{ color: T.muted, margin: 0 }}>Loading...</p>;
  if (!rows.length)
    return (
      <p style={{ color: T.muted, margin: 0 }}>No attendance recorded yet.</p>
    );
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}
      >
        <thead>
          <tr>
            <th style={th}>MEMBER</th>
            <th style={th}>STUDENT NO.</th>
            <th style={th}>STATUS</th>
            <th style={th}>HOW</th>
            <th style={th}>WHEN</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ opacity: r.status === "Voided" ? 0.55 : 1 }}>
              <td style={td}>{r.name}</td>
              <td style={td}>{r.student_number}</td>
              <td style={td}>
                {r.status}
                {r.excuse_reason ? " · " + r.excuse_reason : ""}
                {r.void_reason ? " · " + r.void_reason : ""}
              </td>
              <td style={td}>{r.method || "—"}</td>
              <td style={td}>
                {new Date(r.marked_at).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SessionsPage() {
  const { ctx } = useAuth();
  const canCreate = can(ctx, "session.create") || !ctx;
  const canQr = can(ctx, "session.qr_display") || !ctx;
  const canInvalidate = can(ctx, "session.qr_invalidate") || !ctx;
  const [tab, setTab] = useState("");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState(null); // null | "new" | session object
  const [ask, setAsk] = useState(null);
  const [view, setView] = useState("");

  const load = useCallback(async () => {
    const r = await rpc("list_sessions", {
      p_status: tab || null,
      p_limit: 50,
      p_offset: 0,
    });
    if (r.error) setErr(r.error);
    else {
      setErr("");
      setData(r.data);
    }
  }, [tab]);

  useEffect(() => {
    if (!live()) return undefined;
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  const run = async (fn, ok) => {
    setMsg("");
    const r = await fn();
    if (r.error) setErr(r.error);
    else {
      setErr("");
      setMsg(ok);
      load();
    }
  };

  const edit = async (s) => {
    const r = await rpc("get_session", { p_id: s.id });
    if (r.error) return setErr(r.error);
    setForm(r.data);
  };

  return (
    <AdminShell
      active="sessions"
      title="Sessions"
      subtitle={
        canCreate
          ? "Create a session, open it when the meeting starts, and close it when it ends."
          : "See every session and who attended. This view is read only."
      }
      actions={
        canCreate && (
          <Btn kind="primary" onClick={() => setForm("new")}>
            Create session
          </Btn>
        )
      }
    >
      {!live() && (
        <Notice tone="warn">Connect the database to manage sessions.</Notice>
      )}
      {msg && <Notice>{msg}</Notice>}
      {err && <Notice tone="error">{err}</Notice>}
      {form && (
        <SessionForm
          initial={form === "new" ? null : form}
          onClose={() => setForm(null)}
          onSaved={(m) => {
            setForm(null);
            setMsg(m);
            load();
          }}
        />
      )}
      <div role="tablist" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          ["", "All"],
          ["Scheduled", "Scheduled"],
          ["Open", "Open"],
          ["Closed", "Closed"],
          ["Cancelled", "Cancelled"],
        ].map(([k, l]) => (
          <button
            key={l}
            role="tab"
            aria-selected={tab === k}
            type="button"
            onClick={() => setTab(k)}
            style={{
              padding: "9px 16px",
              borderRadius: 20,
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: "bold",
              cursor: "pointer",
              color: tab === k ? "#fff" : T.muted,
              background: tab === k ? T.blue : "transparent",
              border: "1px solid " + (tab === k ? T.blue : "#333"),
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {((data && data.rows) || []).map((s) => (
          <article key={s.id} style={{ ...card, padding: 18 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: 18 }}>{s.title}</h2>
                  <Chip status={STATUS_CHIP[s.status]}>{s.status}</Chip>
                </div>
                <div style={{ marginTop: 6, color: T.muted, fontSize: 14 }}>
                  {whenText(s.start_at, s.end_at, s.venue)}
                </div>
                <div style={{ marginTop: 6, color: T.dim, fontSize: 13 }}>
                  {s.present} present · {s.excused} excused
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                }}
              >
                {canCreate &&
                  (s.status === "Scheduled" || s.status === "Closed") && (
                    <Btn
                      kind="approve"
                      onClick={() =>
                        run(
                          () => rpc("open_session", { p_id: s.id }),
                          s.status === "Closed"
                            ? "Session reopened."
                            : "Session open. Members can scan now.",
                        )
                      }
                    >
                      {s.status === "Closed" ? "Reopen" : "Open"}
                    </Btn>
                  )}
                {canQr && s.status === "Open" && (
                  <Link
                    to={"/display?session=" + s.id}
                    style={{ textDecoration: "none" }}
                  >
                    <Btn kind="primary" tabIndex={-1}>
                      Open QR display
                    </Btn>
                  </Link>
                )}
                {canCreate && s.status === "Open" && (
                  <Btn
                    onClick={() =>
                      setAsk({
                        title: "Close the attendance window?",
                        body:
                          s.title +
                          " will stop accepting scans. Members who scan after this are told attendance is closed, and a Registrar must mark them by hand.",
                        confirmLabel: "Close window",
                        tone: "warning",
                        run: () =>
                          run(
                            () => rpc("close_session", { p_id: s.id }),
                            "Attendance window closed for " + s.title + ".",
                          ),
                      })
                    }
                  >
                    Close window
                  </Btn>
                )}
                {canInvalidate && s.status === "Open" && (
                  <Btn
                    onClick={() =>
                      setAsk({
                        title: "Replace the QR code?",
                        body: "Every code shown so far stops working at once. Use this if a photo of the code is being shared.",
                        confirmLabel: "Replace code",
                        tone: "warning",
                        run: () =>
                          run(
                            () => rpc("regenerate_qr", { p_session: s.id }),
                            "The old codes no longer work.",
                          ),
                      })
                    }
                  >
                    Replace QR
                  </Btn>
                )}
                {canCreate &&
                  (s.status === "Scheduled" || s.status === "Open") && (
                    <Btn onClick={() => edit(s)}>Edit</Btn>
                  )}
                {canCreate &&
                  (s.status === "Scheduled" || s.status === "Open") && (
                    <Btn
                      kind="decline"
                      onClick={() =>
                        setAsk({
                          title: "Cancel " + s.title + "?",
                          body: "The session is cancelled and stops counting. The reason is kept in the audit log.",
                          reasonLabel: "Reason",
                          confirmLabel: "Cancel session",
                          tone: "danger",
                          run: (reason) =>
                            run(
                              () =>
                                rpc("cancel_session", {
                                  p_id: s.id,
                                  p_reason: reason,
                                }),
                              "Session cancelled.",
                            ),
                        })
                      }
                    >
                      Cancel
                    </Btn>
                  )}
                {can(ctx, "attendance.view_list") && (
                  <Btn onClick={() => setView(view === s.id ? "" : s.id)}>
                    {view === s.id ? "Hide list" : "Attendance"}
                  </Btn>
                )}
              </div>
            </div>
            {view === s.id && (
              <div style={{ marginTop: 14 }}>
                <Attendance id={s.id} />
              </div>
            )}
          </article>
        ))}
        {data && data.rows.length === 0 && (
          <p style={{ color: T.muted }}>No sessions here yet.</p>
        )}
        {!data && live() && !err && (
          <p style={{ color: T.muted }}>Loading...</p>
        )}
      </section>
      {ask && (
        <ConfirmDialog
          cfg={ask}
          onCancel={() => setAsk(null)}
          onConfirm={(reason) => {
            const f = ask.run;
            setAsk(null);
            f(reason);
          }}
        />
      )}
    </AdminShell>
  );
}
