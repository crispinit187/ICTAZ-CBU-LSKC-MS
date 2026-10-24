import React, { useCallback, useEffect, useState } from "react";
import AdminShell from "../components/admin/AdminShell.jsx";
import { Btn, Notice, T, card, input } from "../components/admin/ui.jsx";
import { live, rpc } from "../lib/api.js";

const DOCS = [
  ["terms", "Terms of use"],
  ["privacy", "Privacy notice"],
  ["staff_confidentiality", "Staff confidentiality"],
];

function Field({ label, children, hint }) {
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
      {hint && (
        <span
          style={{ display: "block", marginTop: 4, color: T.dim, fontSize: 12 }}
        >
          {hint}
        </span>
      )}
    </label>
  );
}

function Qr({ say }) {
  const [v, setV] = useState({ qr_rotation_seconds: 45, qr_grace_seconds: 10 });
  const [q, setQ] = useState(null);
  useEffect(() => {
    rpc("get_settings").then((r) => !r.error && setV(r.data));
    rpc("email_queue_summary").then((r) => !r.error && setQ(r.data));
  }, []);
  const save = async (key) => {
    const r = await rpc("save_setting", {
      p_key: key,
      p_value: Number(v[key]),
    });
    say(
      r.error
        ? { tone: "error", text: r.error }
        : { tone: "ok", text: "Saved. It applies to codes from now on." },
    );
  };
  return (
    <>
      <section style={card}>
        <h2 style={{ margin: "0 0 16px", fontSize: 18 }}>QR code</h2>
        <div style={{ display: "grid", gap: 16, maxWidth: 420 }}>
          <Field label="Code changes every (seconds)" hint="Between 30 and 60.">
            <div style={{ display: "flex", gap: 10 }}>
              <input
                aria-label="Rotation seconds"
                type="number"
                min="30"
                max="60"
                style={{ ...input, width: 110 }}
                value={v.qr_rotation_seconds}
                onChange={(e) =>
                  setV({ ...v, qr_rotation_seconds: e.target.value })
                }
              />
              <Btn kind="primary" onClick={() => save("qr_rotation_seconds")}>
                Save
              </Btn>
            </div>
          </Field>
          <Field
            label="Old code still works for (seconds)"
            hint="Between 0 and 30. Covers a scan made as the code changes."
          >
            <div style={{ display: "flex", gap: 10 }}>
              <input
                aria-label="Grace seconds"
                type="number"
                min="0"
                max="30"
                style={{ ...input, width: 110 }}
                value={v.qr_grace_seconds}
                onChange={(e) =>
                  setV({ ...v, qr_grace_seconds: e.target.value })
                }
              />
              <Btn kind="primary" onClick={() => save("qr_grace_seconds")}>
                Save
              </Btn>
            </div>
          </Field>
        </div>
      </section>
      {q && (
        <section style={card}>
          <h2 style={{ margin: "0 0 10px", fontSize: 18 }}>Email queue</h2>
          <p style={{ margin: 0, color: T.muted, fontSize: 14 }}>
            {q.queued} waiting · {q.sent} sent · {q.failed} failed
          </p>
          {q.recent_failures.map((f, i) => (
            <p
              key={i}
              style={{ margin: "8px 0 0", color: "#ffb3b3", fontSize: 13 }}
            >
              {f.template_code} to {f.to_email}: {f.last_error}
            </p>
          ))}
        </section>
      )}
    </>
  );
}

function Terms({ say }) {
  const [rows, setRows] = useState([]);
  const [doc, setDoc] = useState("terms");
  const [body, setBody] = useState("");
  const load = useCallback(async () => {
    const r = await rpc("list_terms");
    if (!r.error) setRows(r.data || []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const mine = rows.filter((x) => x.doc_type === doc);
  const cur = mine[0];
  const publish = async () => {
    const r = await rpc("publish_terms", { p_doc_type: doc, p_body: body });
    if (r.error) return say({ tone: "error", text: r.error });
    say({
      tone: "ok",
      text:
        "Version " +
        r.data +
        " is published. Members must accept it the next time they sign in.",
    });
    setBody("");
    load();
  };
  return (
    <section style={card}>
      <h2 style={{ margin: "0 0 16px", fontSize: 18 }}>Terms and notices</h2>
      <div style={{ display: "grid", gap: 14, maxWidth: 760 }}>
        <Field label="Document">
          <select
            aria-label="Document"
            style={input}
            value={doc}
            onChange={(e) => setDoc(e.target.value)}
          >
            {DOCS.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        {cur && (
          <p style={{ margin: 0, color: T.muted, fontSize: 13 }}>
            Current version {cur.version}, accepted by {cur.accepted}{" "}
            {cur.accepted === 1 ? "person" : "people"}.
          </p>
        )}
        <Field
          label="New text"
          hint="Publishing creates a new version. People who accepted the old one are asked again."
        >
          <textarea
            aria-label="New text"
            rows={10}
            style={{ ...input, width: "100%", resize: "vertical" }}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={cur ? cur.body : ""}
          />
        </Field>
        <div>
          <Btn
            kind="primary"
            disabled={body.trim().length < 20}
            onClick={publish}
          >
            Publish new version
          </Btn>
        </div>
      </div>
    </section>
  );
}

function Templates({ say }) {
  const [rows, setRows] = useState([]);
  const [sel, setSel] = useState("");
  const [f, setF] = useState(null);
  useEffect(() => {
    rpc("list_email_templates").then((r) => {
      if (r.error) return;
      setRows(r.data || []);
      if (r.data && r.data[0]) {
        setSel(r.data[0].code);
        setF(r.data[0]);
      }
    });
  }, []);
  const pick = (code) => {
    setSel(code);
    setF(rows.find((x) => x.code === code));
  };
  const save = async () => {
    const r = await rpc("save_email_template", {
      p_code: f.code,
      p_subject: f.subject,
      p_body: f.body,
      p_sender_name: f.sender_name || null,
      p_reply_to: f.reply_to || null,
      p_signature: f.signature || null,
    });
    if (r.error) return say({ tone: "error", text: r.error });
    setRows(rows.map((x) => (x.code === f.code ? f : x)));
    say({ tone: "ok", text: "Email saved." });
  };
  if (!f) return null;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <section style={card}>
      <h2 style={{ margin: "0 0 16px", fontSize: 18 }}>Email messages</h2>
      <div style={{ display: "grid", gap: 14, maxWidth: 760 }}>
        <Field label="Email">
          <select
            aria-label="Email"
            style={input}
            value={sel}
            onChange={(e) => pick(e.target.value)}
          >
            {rows.map((r) => (
              <option key={r.code} value={r.code}>
                {r.code.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </Field>
        <p style={{ margin: 0, color: T.muted, fontSize: 13 }}>
          You can use:{" "}
          {f.allowed_placeholders.map((p) => "{{" + p + "}}").join(", ")}
        </p>
        <Field label="Subject">
          <input
            aria-label="Subject"
            style={{ ...input, width: "100%" }}
            value={f.subject}
            onChange={set("subject")}
          />
        </Field>
        <Field label="Message">
          <textarea
            aria-label="Message"
            rows={8}
            style={{ ...input, width: "100%", resize: "vertical" }}
            value={f.body}
            onChange={set("body")}
          />
        </Field>
        <Field label="Sender name">
          <input
            aria-label="Sender name"
            style={{ ...input, width: "100%" }}
            value={f.sender_name || ""}
            onChange={set("sender_name")}
          />
        </Field>
        <Field label="Reply-to address">
          <input
            aria-label="Reply-to address"
            style={{ ...input, width: "100%" }}
            value={f.reply_to || ""}
            onChange={set("reply_to")}
          />
        </Field>
        <Field label="Signature">
          <textarea
            aria-label="Signature"
            rows={3}
            style={{ ...input, width: "100%", resize: "vertical" }}
            value={f.signature || ""}
            onChange={set("signature")}
          />
        </Field>
        <div>
          <Btn kind="primary" onClick={save}>
            Save email
          </Btn>
        </div>
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState("qr");
  const [msg, setMsg] = useState(null);
  const TABS = [
    ["qr", "QR and email queue"],
    ["terms", "Terms"],
    ["email", "Email messages"],
  ];
  return (
    <AdminShell
      active="settings"
      title="Settings"
      subtitle="Super Admin only. Changes are recorded in the audit log."
    >
      <div role="tablist" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {TABS.map(([k, l]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => {
              setTab(k);
              setMsg(null);
            }}
            style={{
              padding: "9px 16px",
              borderRadius: 20,
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: "bold",
              cursor: "pointer",
              border: "1px solid " + (tab === k ? T.blue : "#333"),
              background: tab === k ? "rgba(0,102,255,0.16)" : "transparent",
              color: tab === k ? T.light : "#fff",
            }}
          >
            {l}
          </button>
        ))}
      </div>
      {msg && (
        <Notice tone={msg.tone} sig={msg}>
          {msg.text}
        </Notice>
      )}
      {!live() && (
        <Notice tone="warn">Connect the database to change settings.</Notice>
      )}
      {live() && tab === "qr" && <Qr say={setMsg} />}
      {live() && tab === "terms" && <Terms say={setMsg} />}
      {live() && tab === "email" && <Templates say={setMsg} />}
    </AdminShell>
  );
}
