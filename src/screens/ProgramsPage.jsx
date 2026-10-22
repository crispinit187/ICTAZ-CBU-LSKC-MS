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
  new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

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

function Semesters({ onError, onDone }) {
  const [rows, setRows] = useState([]);
  const [edit, setEdit] = useState(null);
  const load = useCallback(async () => {
    const r = await rpc("list_semesters");
    if (!r.error) setRows(r.data || []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const save = async (e) => {
    e.preventDefault();
    const r = await rpc("save_semester", {
      p_id: edit.id,
      p_name: edit.name,
      p_start: edit.start_date,
      p_end: edit.end_date,
      p_current: edit.is_current,
    });
    if (r.error) return onError(r.error);
    setEdit(null);
    load();
    onDone("Semester saved.");
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
        <h2 style={{ margin: 0, fontSize: 18 }}>Semesters</h2>
        <Btn
          onClick={() =>
            setEdit({
              id: null,
              name: "",
              start_date: "",
              end_date: "",
              is_current: rows.length === 0,
            })
          }
        >
          Add semester
        </Btn>
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
              placeholder="Semester 1, 2027/28"
              onChange={(e) => setEdit({ ...edit, name: e.target.value })}
            />
          </Label>
          <Label text="Starts">
            <input
              required
              type="date"
              style={input}
              value={edit.start_date}
              onChange={(e) => setEdit({ ...edit, start_date: e.target.value })}
            />
          </Label>
          <Label text="Ends">
            <input
              required
              type="date"
              style={input}
              value={edit.end_date}
              onChange={(e) => setEdit({ ...edit, end_date: e.target.value })}
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
              checked={edit.is_current}
              onChange={(e) =>
                setEdit({ ...edit, is_current: e.target.checked })
              }
            />
            Current semester
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
            <th style={th}>SEMESTER</th>
            <th style={th}>DATES</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td style={td}>
                {s.name} {s.is_current && <Chip status="Active">Current</Chip>}
              </td>
              <td style={td}>
                {fmt(s.start_date)} to {fmt(s.end_date)}
              </td>
              <td style={{ ...td, textAlign: "right" }}>
                <Btn onClick={() => setEdit({ ...s })}>Edit</Btn>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p style={{ padding: 20, margin: 0, color: T.muted }}>
          No semesters yet. The dashboard needs a current one.
        </p>
      )}
    </section>
  );
}

export default function ProgramsPage() {
  const { ctx } = useAuth();
  const canSemesters = can(ctx, "semester.manage") || !ctx;
  const [only, setOnly] = useState(false);
  const [rows, setRows] = useState(null);
  const [all, setAll] = useState([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [ask, setAsk] = useState(null);
  const [rename, setRename] = useState(null);
  const [mergeFor, setMergeFor] = useState(null);
  const [target, setTarget] = useState("");

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([
      rpc("list_programs", { p_only_unreviewed: only }),
      rpc("list_programs", { p_only_unreviewed: false }),
    ]);
    if (a.error) return setErr(a.error);
    setErr("");
    setRows(a.data || []);
    setAll(b.error ? [] : b.data || []);
  }, [only]);

  useEffect(() => {
    if (live()) load();
  }, [load]);

  const done = (m) => {
    setMsg(m);
    setErr("");
    load();
  };

  return (
    <AdminShell
      active="programs"
      title="Programs"
      subtitle="Programmes members typed in. Join spelling variants into one so attendance is counted together."
    >
      {!live() && (
        <Notice tone="warn">Connect the database to manage programs.</Notice>
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
          checked={only}
          onChange={(e) => setOnly(e.target.checked)}
        />
        Only show programs that need review
      </label>
      <section style={{ ...card, padding: 8, overflowX: "auto" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}
        >
          <thead>
            <tr>
              <th style={th}>PROGRAM</th>
              <th style={th}>MEMBERS</th>
              <th style={th}>SPELLINGS SEEN</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((p) => (
              <React.Fragment key={p.id}>
                <tr>
                  <td style={td}>
                    {rename && rename.id === p.id ? (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const r = await rpc("rename_program", {
                            p_id: p.id,
                            p_name: rename.name,
                          });
                          if (r.error) return setErr(r.error);
                          setRename(null);
                          done("Renamed.");
                        }}
                        style={{ display: "flex", gap: 8 }}
                      >
                        <input
                          autoFocus
                          style={{ ...input, minWidth: 200 }}
                          value={rename.name}
                          onChange={(e) =>
                            setRename({ ...rename, name: e.target.value })
                          }
                          aria-label="New name"
                        />
                        <Btn kind="primary" type="submit">
                          Save
                        </Btn>
                        <Btn onClick={() => setRename(null)}>Cancel</Btn>
                      </form>
                    ) : (
                      <>
                        <strong>{p.name}</strong>{" "}
                        {!p.is_reviewed && (
                          <Chip status="Pending">Needs review</Chip>
                        )}
                      </>
                    )}
                  </td>
                  <td style={td}>{p.members}</td>
                  <td style={{ ...td, color: T.dim, fontSize: 13 }}>
                    {(p.spellings || []).join(", ")}
                  </td>
                  <td
                    style={{ ...td, whiteSpace: "nowrap", textAlign: "right" }}
                  >
                    {!p.is_reviewed && (
                      <Btn
                        kind="approve"
                        onClick={async () => {
                          const r = await rpc("mark_program_reviewed", {
                            p_id: p.id,
                          });
                          if (r.error) setErr(r.error);
                          else done(p.name + " marked as reviewed.");
                        }}
                        style={{ marginRight: 8 }}
                      >
                        Looks right
                      </Btn>
                    )}
                    <Btn
                      onClick={() => setRename({ id: p.id, name: p.name })}
                      style={{ marginRight: 8 }}
                    >
                      Rename
                    </Btn>
                    <Btn
                      onClick={() => {
                        setMergeFor(mergeFor === p.id ? null : p.id);
                        setTarget("");
                      }}
                    >
                      Merge into...
                    </Btn>
                  </td>
                </tr>
                {mergeFor === p.id && (
                  <tr>
                    <td
                      colSpan={4}
                      style={{ ...td, background: "rgba(255,255,255,0.02)" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ color: T.muted, fontSize: 14 }}>
                          Treat “{p.name}” as the same program as
                        </span>
                        <select
                          style={input}
                          value={target}
                          onChange={(e) => setTarget(e.target.value)}
                          aria-label="Merge into"
                        >
                          <option value="">Choose...</option>
                          {all
                            .filter((x) => x.id !== p.id)
                            .map((x) => (
                              <option key={x.id} value={x.id}>
                                {x.name}
                              </option>
                            ))}
                        </select>
                        <Btn
                          kind="primary"
                          disabled={!target}
                          onClick={() => {
                            const t = all.find((x) => x.id === target);
                            setAsk({
                              title:
                                "Merge “" + p.name + "” into “" + t.name + "”?",
                              body:
                                "Members listed under “" +
                                p.name +
                                "” move to “" +
                                t.name +
                                "”. Nothing is deleted, and old attendance keeps the program name it had at the time.",
                              reasonLabel: "Why are these the same program?",
                              confirmLabel: "Merge",
                              tone: "warning",
                              run: async (reason) => {
                                const r = await rpc("merge_programs", {
                                  p_source: p.id,
                                  p_target: target,
                                  p_reason: reason,
                                });
                                if (r.error) setErr(r.error);
                                else {
                                  setMergeFor(null);
                                  done(
                                    "Merged “" +
                                      p.name +
                                      "” into “" +
                                      t.name +
                                      "”.",
                                  );
                                }
                              },
                            });
                          }}
                        >
                          Merge
                        </Btn>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {rows && rows.length === 0 && (
          <p style={{ padding: 20, margin: 0, color: T.muted }}>
            {only ? "Nothing needs review." : "No programs yet."}
          </p>
        )}
      </section>
      {canSemesters && live() && <Semesters onError={setErr} onDone={setMsg} />}
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
