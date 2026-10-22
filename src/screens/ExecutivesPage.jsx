import React, { useCallback, useEffect, useState } from "react";
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

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

function Label({ text, children }) {
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
        {text}
      </span>
      {children}
    </label>
  );
}

function AddExecutive({ positions, onDone, onError }) {
  const [q, setQ] = useState("");
  const [found, setFound] = useState([]);
  const [member, setMember] = useState(null);
  const [pos, setPos] = useState("");
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2 || member) return setFound([]);
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
  }, [q, member]);

  const submit = async (e) => {
    e.preventDefault();
    if (!member || !pos) return;
    setBusy(true);
    const r = await rpc("add_executive", {
      p_member: member.id,
      p_position: pos,
      p_start: start,
    });
    setBusy(false);
    if (r.error) return onError(r.error);
    setMember(null);
    setQ("");
    setPos("");
    onDone(member.name + " is now an executive.");
  };

  return (
    <section style={{ ...card, maxWidth: 640 }}>
      <h2 style={{ margin: 0, fontSize: 18 }}>Add an executive</h2>
      <form
        onSubmit={submit}
        style={{
          marginTop: 14,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div>
          <span
            style={{
              display: "block",
              marginBottom: 6,
              color: T.muted,
              fontSize: 13,
            }}
          >
            Member
          </span>
          {member ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <strong>
                {member.name} · {member.student_number}
              </strong>
              <Btn
                onClick={() => setMember(null)}
                style={{ padding: "4px 10px" }}
              >
                Change
              </Btn>
            </div>
          ) : (
            <>
              <input
                style={{ ...input, width: "100%" }}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Type a name or student number"
                aria-label="Search members"
              />
              {found.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMember(m)}
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
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Label text="Position">
            <select
              required
              style={input}
              value={pos}
              onChange={(e) => setPos(e.target.value)}
            >
              <option value="">Choose...</option>
              {positions
                .filter((p) => !p.is_retired)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </Label>
          <Label text="Start date">
            <input
              type="date"
              required
              style={input}
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </Label>
        </div>
        <div>
          <Btn kind="primary" type="submit" disabled={!member || !pos || busy}>
            Add executive
          </Btn>
        </div>
      </form>
    </section>
  );
}

function Positions({ positions, canManage, onChanged, onError }) {
  const [edit, setEdit] = useState(null);
  const blank = {
    id: null,
    name: "",
    allows_multiple: false,
    display_order: (positions.length + 1) * 10,
    is_retired: false,
  };
  const save = async (e) => {
    e.preventDefault();
    const r = await rpc("save_executive_position", {
      p_id: edit.id,
      p_name: edit.name,
      p_allows_multiple: edit.allows_multiple,
      p_display_order: Number(edit.display_order),
      p_retired: edit.is_retired,
    });
    if (r.error) return onError(r.error);
    setEdit(null);
    onChanged("Position saved.");
  };
  return (
    <section style={{ ...card, padding: 8, overflowX: "auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 12px 4px",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>Positions</h2>
        {canManage && <Btn onClick={() => setEdit(blank)}>Add position</Btn>}
      </div>
      {edit && (
        <form
          onSubmit={save}
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "flex-end",
            padding: 12,
          }}
        >
          <Label text="Name">
            <input
              required
              style={input}
              value={edit.name}
              onChange={(e) => setEdit({ ...edit, name: e.target.value })}
            />
          </Label>
          <Label text="Order">
            <input
              type="number"
              style={{ ...input, width: 90 }}
              value={edit.display_order}
              onChange={(e) =>
                setEdit({ ...edit, display_order: e.target.value })
              }
            />
          </Label>
          <label
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              color: T.muted,
              fontSize: 14,
              paddingBottom: 12,
            }}
          >
            <input
              type="checkbox"
              checked={edit.allows_multiple}
              onChange={(e) =>
                setEdit({ ...edit, allows_multiple: e.target.checked })
              }
            />
            Several people can hold it
          </label>
          <label
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              color: T.muted,
              fontSize: 14,
              paddingBottom: 12,
            }}
          >
            <input
              type="checkbox"
              checked={edit.is_retired}
              onChange={(e) =>
                setEdit({ ...edit, is_retired: e.target.checked })
              }
            />
            Retired
          </label>
          <Btn kind="primary" type="submit">
            Save
          </Btn>
          <Btn onClick={() => setEdit(null)}>Cancel</Btn>
        </form>
      )}
      <table
        style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}
      >
        <thead>
          <tr>
            <th style={th}>POSITION</th>
            <th style={th}>HOLDERS</th>
            <th style={th}>RULE</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <tr key={p.id} style={{ opacity: p.is_retired ? 0.55 : 1 }}>
              <td style={td}>
                {p.name}{" "}
                {p.is_retired && <Chip status="Deactivated">Retired</Chip>}
              </td>
              <td style={td}>{p.holders}</td>
              <td style={td}>
                {p.allows_multiple ? "Several people" : "One person"}
              </td>
              <td style={{ ...td, textAlign: "right" }}>
                {canManage && <Btn onClick={() => setEdit({ ...p })}>Edit</Btn>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function ExecutivesPage() {
  const { ctx } = useAuth();
  const canProfiles = can(ctx, "executive_profile.manage") || !ctx;
  const canPositions = can(ctx, "executive_position.manage") || !ctx;
  const [past, setPast] = useState(false);
  const [rows, setRows] = useState(null);
  const [positions, setPositions] = useState([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [ask, setAsk] = useState(null);
  const [since, setSince] = useState(null); // { row, date, reason }

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([
      rpc("list_executives", { p_include_past: past }),
      rpc("list_executive_positions"),
    ]);
    if (a.error) return setErr(a.error);
    setErr("");
    setRows(a.data || []);
    setPositions(b.error ? [] : b.data || []);
  }, [past]);

  useEffect(() => {
    if (live()) load();
  }, [load]);

  const done = (m) => {
    setMsg(m);
    setErr("");
    load();
  };

  const toggle = async (r) => {
    const x = await rpc("set_executive_display", {
      p_profile: r.profile_id,
      p_on: !r.public_display,
    });
    if (x.error) return setErr(x.error);
    done(
      r.name +
        (r.public_display
          ? " is no longer shown publicly."
          : " is now shown on the public page."),
    );
  };

  return (
    <AdminShell
      active="executives"
      title="Executives"
      subtitle="Current executive members, their positions and public display."
      actions={
        <a
          href={import.meta.env.BASE_URL + "executives"}
          target="_blank"
          rel="noreferrer"
          style={{ fontWeight: "bold", fontSize: 14 }}
        >
          Open the public page
        </a>
      }
    >
      {!live() && (
        <Notice tone="warn">Connect the database to manage executives.</Notice>
      )}
      {msg && <Notice>{msg}</Notice>}
      {err && <Notice tone="error">{err}</Notice>}
      <label
        style={{
          color: T.muted,
          fontSize: 14,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <input
          type="checkbox"
          checked={past}
          onChange={(e) => setPast(e.target.checked)}
        />
        Show past executives
      </label>
      <section style={{ ...card, padding: 8, overflowX: "auto" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}
        >
          <thead>
            <tr>
              <th style={th}>POSITION</th>
              <th style={th}>MEMBER</th>
              <th style={th}>SINCE</th>
              <th style={th}>ROLE</th>
              <th style={th}>PUBLIC DISPLAY</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((r) => (
              <tr key={r.profile_id} style={{ opacity: r.end_date ? 0.55 : 1 }}>
                <td style={td}>{r.position}</td>
                <td style={td}>
                  <div style={{ fontWeight: "bold" }}>{r.name}</div>
                  <div style={{ color: T.dim, fontSize: 12 }}>
                    {r.student_number} · {r.program || "—"}
                  </div>
                </td>
                <td style={td}>
                  {fmt(r.start_date)}
                  {r.end_date && (
                    <div style={{ color: T.dim, fontSize: 12 }}>
                      Ended {fmt(r.end_date)}
                    </div>
                  )}
                </td>
                <td style={td}>{r.role}</td>
                <td style={td}>
                  {r.end_date ? (
                    "—"
                  ) : (
                    <>
                      <Chip
                        status={r.public_display ? "Active" : "Deactivated"}
                      >
                        {r.public_display ? "On" : "Off"}
                      </Chip>
                      <div
                        style={{
                          color: r.consent ? "#9df0c8" : T.amber,
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        {r.consent ? "Consent given" : "No consent yet"}
                      </div>
                    </>
                  )}
                </td>
                <td style={{ ...td, whiteSpace: "nowrap", textAlign: "right" }}>
                  {canProfiles && !r.end_date && (
                    <>
                      <Btn
                        disabled={!r.public_display && !r.consent}
                        title={
                          !r.consent
                            ? "They must give consent on their account page first"
                            : ""
                        }
                        onClick={() => toggle(r)}
                        style={{ marginRight: 8 }}
                      >
                        {r.public_display ? "Hide" : "Show"}
                      </Btn>
                      <Btn
                        onClick={() =>
                          setSince({
                            row: r,
                            date: String(r.start_date).slice(0, 10),
                            reason: "",
                          })
                        }
                        style={{ marginRight: 8 }}
                      >
                        Edit since
                      </Btn>
                      <Btn
                        kind="decline"
                        onClick={() =>
                          setAsk({
                            title: "End " + r.name + " as " + r.position + "?",
                            body: "Their executive profile ends today, and any Registrar, Reviewer or Administrator role they hold is removed automatically.",
                            reasonLabel: "Reason (recorded in the audit log)",
                            confirmLabel: "End profile",
                            tone: "danger",
                            run: async (reason) => {
                              const x = await rpc("end_executive", {
                                p_profile: r.profile_id,
                                p_reason: reason,
                              });
                              if (x.error) setErr(x.error);
                              else
                                done(
                                  r.name + " is no longer " + r.position + ".",
                                );
                            },
                          })
                        }
                      >
                        End
                      </Btn>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows && rows.length === 0 && (
          <p style={{ padding: 20, margin: 0, color: T.muted }}>
            No executives yet. Add one below.
          </p>
        )}
      </section>
      {canProfiles && (
        <AddExecutive positions={positions} onDone={done} onError={setErr} />
      )}
      <Positions
        positions={positions}
        canManage={canPositions}
        onChanged={done}
        onError={setErr}
      />
      {since && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit since date"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.7)",
            padding: 20,
          }}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const x = await rpc("update_executive_since", {
                p_profile: since.row.profile_id,
                p_start: since.date,
                p_reason: since.reason,
              });
              if (x.error) setErr(x.error);
              else done("Updated the since date for " + since.row.name + ".");
              setSince(null);
            }}
            style={{
              ...card,
              background: "#0d0d0d",
              width: "100%",
              maxWidth: 440,
            }}
          >
            <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>Edit since date</h2>
            <p style={{ margin: "0 0 16px", color: T.muted, fontSize: 14 }}>
              {since.row.name}, {since.row.position}. This fixes a wrong date.
              For a real change of position, end this profile and add a new one.
            </p>
            <label style={{ display: "block", marginBottom: 12 }}>
              <span
                style={{
                  display: "block",
                  marginBottom: 6,
                  color: T.muted,
                  fontSize: 13,
                }}
              >
                Since
              </span>
              <input
                aria-label="Since"
                type="date"
                required
                max={new Date().toISOString().slice(0, 10)}
                style={{ ...input, width: "100%" }}
                value={since.date}
                onChange={(e) => setSince({ ...since, date: e.target.value })}
              />
            </label>
            <label style={{ display: "block" }}>
              <span
                style={{
                  display: "block",
                  marginBottom: 6,
                  color: T.muted,
                  fontSize: 13,
                }}
              >
                Reason (recorded in the audit log)
              </span>
              <input
                aria-label="Reason"
                required
                minLength={3}
                style={{ ...input, width: "100%" }}
                value={since.reason}
                onChange={(e) => setSince({ ...since, reason: e.target.value })}
              />
            </label>
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 18,
                justifyContent: "flex-end",
              }}
            >
              <Btn onClick={() => setSince(null)}>Cancel</Btn>
              <button
                type="submit"
                className="btn-primary"
                style={{
                  padding: "10px 16px",
                  border: "none",
                  borderRadius: 8,
                  background: T.blue,
                  color: "#fff",
                  fontFamily: "inherit",
                  fontSize: 14,
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Save
              </button>
            </div>
          </form>
        </div>
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
    </AdminShell>
  );
}
