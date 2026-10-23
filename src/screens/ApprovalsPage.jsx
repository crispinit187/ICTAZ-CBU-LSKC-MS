import React, { useCallback, useEffect, useState } from "react";
import AdminShell from "../components/admin/AdminShell.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { Btn, Notice, T, card, td, th } from "../components/admin/ui.jsx";
import { ago, live, rpc } from "../lib/api.js";
import { can, useAuth } from "../auth/AuthProvider.jsx";

export default function ApprovalsPage() {
  const auth = useAuth();
  const canDecide = !live() || can(auth.ctx, "account.approve");
  const [tab, setTab] = useState("Pending");
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const [ask, setAsk] = useState(null);

  const load = useCallback(async () => {
    const r = await rpc("list_pending_registrations", { p_status: tab });
    if (r.error) setErr(r.error);
    else {
      setErr("");
      setRows(r.data || []);
    }
  }, [tab]);

  useEffect(() => {
    setRows(null);
    if (live()) load();
  }, [load]);

  const run = async (id, fn, ok) => {
    setBusy(id);
    setMsg("");
    const r = await fn();
    setBusy("");
    if (r.error) setErr(r.error);
    else {
      setErr("");
      setMsg(ok);
      load();
    }
  };

  const approve = (r) =>
    run(
      r.id,
      () => rpc("approve_registration", { p_id: r.id }),
      "Approved " + r.name + ". They have been emailed and can sign in now.",
    );
  const reopen = (r) =>
    run(
      r.id,
      () => rpc("reopen_registration", { p_id: r.id }),
      r.name + " is back in the waiting list.",
    );
  const decline = (r) =>
    setAsk({
      title: "Decline " + r.name + "?",
      body: "Their registration is declined and they are emailed the reason you give. They cannot sign in.",
      reasonLabel: "Reason (sent to the member)",
      confirmLabel: "Decline registration",
      tone: "danger",
      run: (reason) =>
        run(
          r.id,
          () => rpc("decline_registration", { p_id: r.id, p_reason: reason }),
          "Declined " + r.name + ". The decision is in the audit log.",
        ),
    });

  return (
    <AdminShell
      active="approvals"
      pending={tab === "Pending" && rows ? rows.length : undefined}
      title="Approvals"
      subtitle="Confirm the person is a genuine member before approving. A decline needs a reason."
    >
      {!live() && (
        <Notice tone="warn">
          Connect the database to see real registrations.
        </Notice>
      )}
      {msg && <Notice>{msg}</Notice>}
      {err && <Notice tone="error">{err}</Notice>}
      <div role="tablist" style={{ display: "flex", gap: 8 }}>
        {[
          ["Pending", "Waiting"],
          ["Rejected", "Declined"],
        ].map(([k, l]) => (
          <button
            key={k}
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
      <section style={{ ...card, padding: 8, overflowX: "auto" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}
        >
          <thead>
            <tr>
              <th style={th}>MEMBER</th>
              <th style={th}>STUDENT NO.</th>
              <th style={th}>PROGRAMME</th>
              <th style={th}>YEAR, SEM</th>
              {canDecide && <th style={th}>SIGN-UP</th>}
              <th style={th}>WHEN</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((r) => (
              <tr key={r.id}>
                <td style={td}>
                  <div style={{ fontWeight: "bold" }}>{r.name}</div>
                  {r.email && (
                    <div style={{ color: T.dim, fontSize: 12 }}>{r.email}</div>
                  )}
                  {tab === "Rejected" && r.status_reason && (
                    <div
                      style={{ color: "#ffb3b3", fontSize: 12, marginTop: 4 }}
                    >
                      Reason: {r.status_reason}
                    </div>
                  )}
                </td>
                <td style={td}>{r.student_number}</td>
                <td style={td}>{r.program || "—"}</td>
                <td style={td}>
                  {r.year_of_study || "—"}, {r.semester_of_study || "—"}
                </td>
                {canDecide && (
                  <td style={td}>
                    {r.method === "google" ? "Google" : "Password"}
                    {!r.email_verified && (
                      <div style={{ color: T.amber, fontSize: 12 }}>
                        Email not confirmed
                      </div>
                    )}
                  </td>
                )}
                <td style={td}>{ago(r.created_at)}</td>
                <td style={{ ...td, whiteSpace: "nowrap", textAlign: "right" }}>
                  {!canDecide ? null : tab === "Pending" ? (
                    <>
                      <Btn
                        kind="approve"
                        disabled={busy === r.id || !r.email_verified}
                        title={
                          r.email_verified
                            ? ""
                            : "They must confirm their email first"
                        }
                        onClick={() => approve(r)}
                        style={{ marginRight: 8 }}
                      >
                        Approve
                      </Btn>
                      <Btn
                        kind="decline"
                        disabled={busy === r.id}
                        onClick={() => decline(r)}
                      >
                        Decline
                      </Btn>
                    </>
                  ) : (
                    <Btn disabled={busy === r.id} onClick={() => reopen(r)}>
                      Reopen
                    </Btn>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows && rows.length === 0 && (
          <p style={{ padding: 20, margin: 0, color: T.muted }}>
            {tab === "Pending"
              ? "No registrations are waiting. You are all caught up."
              : "No declined registrations."}
          </p>
        )}
        {!rows && live() && !err && (
          <p style={{ padding: 20, margin: 0, color: T.muted }}>Loading...</p>
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
