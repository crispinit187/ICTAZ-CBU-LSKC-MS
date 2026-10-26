import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { callFunction, live, rpc } from "../lib/api.js";

const PAGE = 25;

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

/* Side panel: one member's details with the actions the viewer is allowed to use. */
function Detail({ id, onClose, onChanged, onDeleted, canDo: baseCan }) {
  const [m, setM] = useState(null);
  // Only a Super Admin may change a Super Admin's account.
  const locked =
    !!m && (m.roles || []).includes("Super Admin") && !baseCan.isSuper;
  const canDo = locked
    ? {
        ...baseCan,
        edit: false,
        number: false,
        suspend: false,
        reset: false,
        del: false,
      }
    : baseCan;
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState(null);
  const [num, setNum] = useState("");
  const [since, setSince] = useState("");
  const [ask, setAsk] = useState(null);
  const [temp, setTemp] = useState("");

  const load = useCallback(async () => {
    const r = await rpc("get_member", { p_id: id });
    if (r.error) return setErr(r.error);
    setM(r.data);
    setForm({
      name: r.data.name || "",
      phone: r.data.phone || "",
      program: r.data.program || r.data.program_raw || "",
      year: r.data.year_of_study || "",
      semester: r.data.semester_of_study || "",
    });
  }, [id]);
  useEffect(() => {
    setM(null);
    setMsg("");
    setErr("");
    setTemp("");
    load();
  }, [load]);

  const act = async (fn, ok) => {
    setErr("");
    setMsg("");
    const r = await fn();
    if (r.error) return setErr(r.error);
    setMsg(ok);
    await load();
    onChanged();
    return r;
  };

  const save = () =>
    act(
      () =>
        rpc("update_member_details", {
          p_id: id,
          p_name: form.name,
          p_phone: form.phone,
          p_program: form.program,
          p_year: form.year ? Number(form.year) : null,
          p_semester: form.semester ? Number(form.semester) : null,
        }),
      "Details saved.",
    );

  const status = (to, title, body, tone) =>
    setAsk({
      title,
      body,
      reasonLabel:
        to === "Active" ? undefined : "Reason (recorded in the audit log)",
      confirmLabel:
        to === "Active"
          ? "Reactivate"
          : to === "Suspended"
            ? "Suspend"
            : "Deactivate",
      tone,
      run: (reason) =>
        act(
          () =>
            rpc("set_member_status", {
              p_id: id,
              p_status: to,
              p_reason: reason || "",
            }),
          "Status is now " + to + ".",
        ),
    });

  const remove = () =>
    setAsk({
      title: "Delete " + m.name + "?",
      body: "This erases their sign-in, name, email, student number, phone and picture for good. Attendance records and the audit log are kept, without their name. This cannot be undone.",
      reasonLabel: "Reason (recorded in the audit log)",
      typeToConfirm: "DELETE",
      confirmLabel: "Delete account",
      tone: "danger",
      run: async (reason) => {
        const r = await callFunction("admin-delete-account", {
          member_id: id,
          reason: reason || "",
        });
        if (r.error) return setErr(r.error);
        onDeleted("Account deleted. The records are kept without the name.");
      },
    });

  const resetPw = () =>
    setAsk({
      title: "Reset password for " + m.name + "?",
      body: "A temporary password is made and shown to you once. Give it to the member privately. They must choose a new one at first sign-in.",
      confirmLabel: "Reset password",
      tone: "warning",
      run: async () => {
        const r = await act(
          () => callFunction("admin-reset-password", { member_id: id }),
          "Password reset.",
        );
        if (r && r.data && r.data.temporary_password)
          setTemp(r.data.temporary_password);
      },
    });

  return (
    <aside
      aria-label="Member details"
      style={{
        ...card,
        flex: "1 1 340px",
        maxWidth: 460,
        alignSelf: "flex-start",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>Member</h2>
        <Btn onClick={onClose} style={{ padding: "6px 12px" }}>
          Close
        </Btn>
      </div>
      {err && <Notice tone="error">{err}</Notice>}
      {msg && <Notice>{msg}</Notice>}
      {temp && (
        <Notice tone="warn">
          Temporary password (shown once):{" "}
          <strong style={{ fontFamily: "monospace", fontSize: 16 }}>
            {temp}
          </strong>
        </Notice>
      )}
      {!m && !err && <p style={{ color: T.muted, margin: 0 }}>Loading...</p>}
      {m && (
        <>
          <div>
            <div style={{ fontSize: 20, fontWeight: "bold" }}>{m.name}</div>
            <div style={{ marginTop: 4, color: T.muted, fontSize: 14 }}>
              {m.student_number}
            </div>
            {m.member_since && (
              <div style={{ marginTop: 4, color: T.dim, fontSize: 13 }}>
                Member since{" "}
                {new Date(m.member_since).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            )}
            <div
              style={{
                marginTop: 8,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Chip status={m.status} />
              {(m.roles || [])
                .filter((r) => r !== "Member")
                .map((r) => (
                  <Chip key={r} status="Deactivated">
                    {r}
                  </Chip>
                ))}
            </div>
            {m.status_reason && (
              <div style={{ marginTop: 8, color: "#ffb3b3", fontSize: 13 }}>
                Reason: {m.status_reason}
              </div>
            )}
          </div>
          <div
            style={{ display: "flex", gap: 24, color: T.muted, fontSize: 14 }}
          >
            <span>
              <strong style={{ color: "#fff", fontSize: 20 }}>
                {m.present}
              </strong>{" "}
              present
            </span>
            <span>
              <strong style={{ color: "#fff", fontSize: 20 }}>
                {m.excused}
              </strong>{" "}
              excused
            </span>
          </div>
          {form && canDo.edit && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <Field label="Full name">
                <input
                  style={{ ...input, width: "100%" }}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
              <div style={{ color: T.dim, fontSize: 13 }}>Email: {m.email}</div>
              <Field label="Phone (optional)">
                <input
                  style={{ ...input, width: "100%" }}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+260971234567"
                />
              </Field>
              <Field label="Programme">
                <input
                  style={{ ...input, width: "100%" }}
                  value={form.program}
                  onChange={(e) =>
                    setForm({ ...form, program: e.target.value })
                  }
                />
              </Field>
              <div style={{ display: "flex", gap: 12 }}>
                <Field label="Year">
                  <select
                    style={input}
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                  >
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5].map((y) => (
                      <option key={y}>{y}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Semester">
                  <select
                    style={input}
                    value={form.semester}
                    onChange={(e) =>
                      setForm({ ...form, semester: e.target.value })
                    }
                  >
                    <option value="">—</option>
                    <option>1</option>
                    <option>2</option>
                  </select>
                </Field>
              </div>
              <div>
                <Btn kind="primary" type="submit">
                  Save details
                </Btn>
              </div>
            </form>
          )}
          {!canDo.edit && (
            <div style={{ color: T.dim, fontSize: 13 }}>
              {locked
                ? "Super Admin accounts can only be managed by another Super Admin."
                : "Your role sees limited details only."}
            </div>
          )}
          {canDo.edit && (
            <div>
              <span
                style={{
                  display: "block",
                  marginBottom: 6,
                  color: T.muted,
                  fontSize: 13,
                }}
              >
                Change member since
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  aria-label="New member since date"
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  style={{ ...input, flex: 1, minWidth: 0 }}
                  value={since}
                  onChange={(e) => setSince(e.target.value)}
                />
                <Btn
                  disabled={!since}
                  onClick={() =>
                    setAsk({
                      title: "Change member since date?",
                      body: "The member since date becomes " + since + ".",
                      reasonLabel: "Reason (recorded in the audit log)",
                      confirmLabel: "Change date",
                      tone: "warning",
                      run: (reason) =>
                        act(
                          () =>
                            rpc("change_member_since", {
                              p_id: id,
                              p_date: since,
                              p_reason: reason,
                            }),
                          "Member since date changed.",
                        ).then(() => setSince("")),
                    })
                  }
                >
                  Change
                </Btn>
              </div>
            </div>
          )}
          {canDo.number && !m.is_bootstrap && (
            <div>
              <span
                style={{
                  display: "block",
                  marginBottom: 6,
                  color: T.muted,
                  fontSize: 13,
                }}
              >
                Change student number
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  aria-label="New student number"
                  style={{ ...input, flex: 1, minWidth: 0 }}
                  inputMode="numeric"
                  maxLength={8}
                  value={num}
                  onChange={(e) => setNum(e.target.value.replace(/\D/g, ""))}
                  placeholder="8 digits"
                />
                <Btn
                  disabled={num.length !== 8}
                  onClick={() =>
                    setAsk({
                      title: "Change student number?",
                      body:
                        "From " +
                        m.student_number +
                        " to " +
                        num +
                        ". The member signs in with the new number.",
                      reasonLabel: "Reason (recorded in the audit log)",
                      confirmLabel: "Change number",
                      tone: "warning",
                      run: (reason) =>
                        act(
                          () =>
                            rpc("change_student_number", {
                              p_id: id,
                              p_new: num,
                              p_reason: reason,
                            }),
                          "Student number changed.",
                        ).then(() => setNum("")),
                    })
                  }
                >
                  Change
                </Btn>
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {canDo.suspend && m.status === "Active" && (
              <Btn
                kind="decline"
                onClick={() =>
                  status(
                    "Suspended",
                    "Suspend " + m.name + "?",
                    "They cannot sign in until reactivated. They are emailed the reason.",
                    "danger",
                  )
                }
              >
                Suspend
              </Btn>
            )}
            {canDo.suspend && m.status !== "Active" && (
              <Btn
                kind="approve"
                onClick={() =>
                  status(
                    "Active",
                    "Reactivate " + m.name + "?",
                    "They can sign in again.",
                    "info",
                  )
                }
              >
                Reactivate
              </Btn>
            )}
            {canDo.suspend && m.status === "Active" && (
              <Btn
                onClick={() =>
                  status(
                    "Deactivated",
                    "Deactivate " + m.name + "?",
                    "Use this when someone has left the chapter. Their history is kept.",
                    "warning",
                  )
                }
              >
                Deactivate
              </Btn>
            )}
            {canDo.reset && m.status === "Active" && (
              <Btn onClick={resetPw}>Reset password</Btn>
            )}
            {canDo.del && m.status === "Deactivated" && (
              <Btn kind="decline" onClick={remove}>
                Delete account
              </Btn>
            )}
          </div>
          {canDo.del && m.status !== "Deactivated" && (
            <div style={{ color: T.dim, fontSize: 12, lineHeight: 1.5 }}>
              To delete this account, deactivate it first.
            </div>
          )}
          {m.history && m.history.length > 0 && (
            <div>
              <div
                style={{
                  color: T.light,
                  fontSize: 11,
                  letterSpacing: 1.5,
                  fontWeight: "bold",
                  marginBottom: 6,
                }}
              >
                HISTORY
              </div>
              {m.history.slice(0, 8).map((h, i) => (
                <div
                  key={i}
                  style={{
                    padding: "6px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    fontSize: 13,
                  }}
                >
                  {h.action.replace(/[._]/g, " ")}
                  <span style={{ color: T.dim }}>
                    {" "}
                    · {new Date(h.at).toLocaleDateString("en-GB")}
                    {h.reason ? " · " + h.reason : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
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
    </aside>
  );
}

/* Members who asked for their account to be deleted. A Super Admin approves (which deletes) or declines. */
function DeletionRequests({ onDeleted, refresh }) {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [ask, setAsk] = useState(null);
  const load = useCallback(async () => {
    const r = await rpc("list_deletion_requests");
    if (r.error) return setErr(r.error);
    setErr("");
    setRows(r.data || []);
  }, []);
  useEffect(() => {
    load();
  }, [load, refresh]);
  if (rows.length === 0 && !err) return null;
  const approve = (q) =>
    setAsk({
      title: "Delete " + q.name + "?",
      body: "Their request is approved. They are deactivated and their sign-in, name, email, student number, phone and picture are erased for good. Attendance records and the audit log are kept, without their name. They are emailed.",
      reasonLabel: "Note (recorded in the audit log)",
      typeToConfirm: "DELETE",
      confirmLabel: "Approve and delete",
      tone: "danger",
      run: async (reason) => {
        const r = await callFunction("admin-delete-account", {
          member_id: q.member_id,
          reason: reason || "",
          request_id: q.id,
        });
        if (r.error) return setErr(r.error);
        await load();
        onDeleted("Account deleted. The records are kept without the name.");
      },
    });
  const decline = (q) =>
    setAsk({
      title: "Decline the request from " + q.name + "?",
      body: "Their account stays as it is. They are emailed the reason you give.",
      reasonLabel: "Reason (sent to the member)",
      confirmLabel: "Decline request",
      tone: "warning",
      run: async (reason) => {
        const r = await rpc("decline_deletion_request", {
          p_id: q.id,
          p_reason: reason || "",
        });
        if (r.error) return setErr(r.error);
        await load();
        onDeleted("Request declined.");
      },
    });
  return (
    <section style={{ ...card, padding: 18 }}>
      <div style={{ fontWeight: "bold", fontSize: 18, marginBottom: 4 }}>
        Deletion requests
      </div>
      <div style={{ color: T.dim, fontSize: 13, marginBottom: 10 }}>
        Members who asked for their account to be deleted.
      </div>
      {err && (
        <Notice tone="error" inline>
          {err}
        </Notice>
      )}
      {rows.map((q) => (
        <div
          key={q.id}
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 0",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ minWidth: 0, flex: "1 1 240px" }}>
            <div style={{ fontWeight: "bold" }}>{q.name}</div>
            <div style={{ color: T.dim, fontSize: 12 }}>
              {q.student_number} · {q.program || "—"} ·{" "}
              {new Date(q.created_at).toLocaleDateString("en-GB")}
            </div>
            {q.reason && (
              <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>
                “{q.reason}”
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn kind="decline" onClick={() => approve(q)}>
              Approve and delete
            </Btn>
            <Btn onClick={() => decline(q)}>Decline</Btn>
          </div>
        </div>
      ))}
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
    </section>
  );
}

function CreateForm({ onClose, onDone }) {
  const [f, setF] = useState({
    name: "",
    student_number: "",
    email: "",
    program: "",
    year: "",
    semester: "",
  });
  const [err, setErr] = useState("");
  const [out, setOut] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) =>
    setF({
      ...f,
      [k]:
        k === "student_number"
          ? e.target.value.replace(/\D/g, "")
          : e.target.value,
    });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await callFunction("admin-create-user", {
      name: f.name,
      student_number: f.student_number,
      email: f.email,
      program: f.program,
      year_of_study: f.year ? Number(f.year) : null,
      semester_of_study: f.semester ? Number(f.semester) : null,
    });
    setBusy(false);
    if (r.error) return setErr(r.error);
    setOut(r.data);
    onDone();
  };
  return (
    <section style={{ ...card, maxWidth: 560 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>Create an account</h2>
        <Btn onClick={onClose} style={{ padding: "6px 12px" }}>
          Close
        </Btn>
      </div>
      {out ? (
        <div
          style={{
            marginTop: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <Notice inline>
            Account created and active. Give the member this temporary password
            privately. It is shown once. They choose a new one at first sign-in.
          </Notice>
          <div style={{ fontFamily: "monospace", fontSize: 20 }}>
            {out.temporary_password}
          </div>
        </div>
      ) : (
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
          <Field label="Full name">
            <input
              required
              style={{ ...input, width: "100%" }}
              value={f.name}
              onChange={set("name")}
            />
          </Field>
          <Field label="Student number (8 digits)">
            <input
              required
              inputMode="numeric"
              maxLength={8}
              style={{ ...input, width: "100%" }}
              value={f.student_number}
              onChange={set("student_number")}
            />
          </Field>
          <Field label="Email">
            <input
              required
              type="email"
              style={{ ...input, width: "100%" }}
              value={f.email}
              onChange={set("email")}
            />
          </Field>
          <Field label="Programme">
            <input
              required
              style={{ ...input, width: "100%" }}
              value={f.program}
              onChange={set("program")}
            />
          </Field>
          <div style={{ display: "flex", gap: 12 }}>
            <Field label="Year">
              <select
                required
                style={input}
                value={f.year}
                onChange={set("year")}
              >
                <option value="">—</option>
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </Field>
            <Field label="Semester">
              <select
                required
                style={input}
                value={f.semester}
                onChange={set("semester")}
              >
                <option value="">—</option>
                <option>1</option>
                <option>2</option>
              </select>
            </Field>
          </div>
          <div>
            <Btn
              kind="primary"
              type="submit"
              disabled={busy || f.student_number.length !== 8}
            >
              {busy ? "Creating..." : "Create account"}
            </Btn>
          </div>
        </form>
      )}
    </section>
  );
}

export default function MembersPage() {
  const { ctx } = useAuth();
  const canDo = {
    edit: can(ctx, "member.edit_details") || !ctx,
    number: can(ctx, "member.change_student_number"),
    suspend: can(ctx, "account.suspend"),
    reset: can(ctx, "account.reset_password"),
    create: can(ctx, "account.create"),
    del: can(ctx, "member.delete"),
    isSuper: !ctx || (ctx.roles || []).includes("Super Admin"),
  };
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [sel, setSel] = useState(null);
  const [creating, setCreating] = useState(false);
  const [note, setNote] = useState("");
  const [tick, setTick] = useState(0);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const n = ++seq.current;
    const r = await rpc("list_members", {
      p_search: q,
      p_status: status || null,
      p_limit: PAGE,
      p_offset: page * PAGE,
    });
    if (n !== seq.current) return;
    if (r.error) setErr(r.error);
    else {
      setErr("");
      setData(r.data);
    }
  }, [q, status, page]);

  useEffect(() => {
    if (!live()) return undefined;
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const deleted = (t) => {
    setNote(t);
    setSel(null);
    setTick((x) => x + 1);
    load();
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE)) : 1;

  return (
    <AdminShell
      active="members"
      title="Members"
      subtitle={
        data
          ? data.total + " members" + (data.full ? "" : " · limited view")
          : "Everyone who has an approved account."
      }
      actions={
        canDo.create && (
          <Btn kind="primary" onClick={() => setCreating(true)}>
            Create account
          </Btn>
        )
      }
    >
      {!live() && (
        <Notice tone="warn">Connect the database to see real members.</Notice>
      )}
      {err && <Notice tone="error">{err}</Notice>}
      {note && <Notice sig={note}>{note}</Notice>}
      {canDo.del && live() && (
        <DeletionRequests onDeleted={deleted} refresh={tick} />
      )}
      {creating && (
        <CreateForm onClose={() => setCreating(false)} onDone={load} />
      )}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <label style={{ flex: "1 1 260px" }}>
          <span
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              overflow: "hidden",
              clip: "rect(0 0 0 0)",
            }}
          >
            Search members
          </span>
          <input
            type="search"
            style={{ ...input, width: "100%" }}
            placeholder="Search by name or student number"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <label>
          <span
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              overflow: "hidden",
              clip: "rect(0 0 0 0)",
            }}
          >
            Status
          </span>
          <select
            style={input}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All statuses</option>
            <option>Active</option>
            <option>Suspended</option>
            <option>Deactivated</option>
          </select>
        </label>
      </div>
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <section
          style={{
            ...card,
            padding: 8,
            flex: "2 1 520px",
            minWidth: 0,
            overflowX: "auto",
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}
          >
            <thead>
              <tr>
                <th style={th}>MEMBER</th>
                <th style={th}>STUDENT NO.</th>
                <th style={th}>PROGRAMME</th>
                <th style={th}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {((data && data.rows) || []).map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSel(r.id)}
                  style={{
                    cursor: "pointer",
                    background:
                      sel === r.id ? "rgba(0,102,255,0.1)" : undefined,
                  }}
                >
                  <td style={td}>
                    <button
                      type="button"
                      onClick={() => setSel(r.id)}
                      style={{
                        all: "unset",
                        cursor: "pointer",
                        fontWeight: "bold",
                        color: "#fff",
                      }}
                    >
                      {r.name}
                    </button>
                    {(r.roles || []).filter((x) => x !== "Member").length >
                      0 && (
                      <div style={{ color: T.light, fontSize: 12 }}>
                        {r.roles.filter((x) => x !== "Member").join(", ")}
                      </div>
                    )}
                  </td>
                  <td style={td}>{r.student_number}</td>
                  <td style={td}>
                    {r.program || "—"}
                    <div style={{ color: T.dim, fontSize: 12 }}>
                      Year {r.year_of_study || "—"}, sem{" "}
                      {r.semester_of_study || "—"}
                    </div>
                  </td>
                  <td style={td}>
                    <Chip status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && data.rows.length === 0 && (
            <p style={{ padding: 20, margin: 0, color: T.muted }}>
              No members match.
            </p>
          )}
          {!data && live() && !err && (
            <p style={{ padding: 20, margin: 0, color: T.muted }}>Loading...</p>
          )}
          {data && data.total > PAGE && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 12,
              }}
            >
              <Btn disabled={page === 0} onClick={() => setPage(page - 1)}>
                Previous
              </Btn>
              <span style={{ color: T.muted, fontSize: 13 }}>
                Page {page + 1} of {pages}
              </span>
              <Btn
                disabled={page + 1 >= pages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Btn>
            </div>
          )}
        </section>
        {sel && (
          <Detail
            id={sel}
            canDo={canDo}
            onClose={() => setSel(null)}
            onChanged={load}
            onDeleted={deleted}
          />
        )}
      </div>
    </AdminShell>
  );
}
