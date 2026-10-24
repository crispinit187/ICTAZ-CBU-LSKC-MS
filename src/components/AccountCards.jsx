import React, { useCallback, useEffect, useState } from "react";
import { Banner, Card } from "./auth/AuthParts.jsx";
import { supabase } from "../lib/supabase.js";
import { rpc } from "../lib/api.js";
import { normalisePhone } from "../lib/phone.js";
import { passwordChecks } from "../lib/password.js";

const field = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 10,
  color: "#f1f6ff",
  fontFamily: "inherit",
  fontSize: 15,
};
const btn = {
  padding: "11px 18px",
  border: "none",
  borderRadius: 9,
  background: "#0066ff",
  color: "#fff",
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: "bold",
  cursor: "pointer",
};
const L = ({ t, children }) => (
  <label style={{ display: "block", marginTop: 12 }}>
    <span
      style={{
        display: "block",
        marginBottom: 6,
        color: "#aebfda",
        fontSize: 13,
      }}
    >
      {t}
    </span>
    {children}
  </label>
);
const H = ({ children }) => (
  <h2 style={{ margin: "0 0 4px", fontSize: 20, letterSpacing: "-0.4px" }}>
    {children}
  </h2>
);

function Details({ prof, onSaved }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({});
  const [msg, setMsg] = useState(null);
  const start = () => {
    setF({
      phone: prof.phone || "",
      program: prof.program || "",
      year: String(prof.year_of_study || ""),
      semester: String(prof.semester_of_study || ""),
    });
    setMsg(null);
    setOpen(true);
  };
  const save = async (e) => {
    e.preventDefault();
    if (f.phone.trim() && !normalisePhone(f.phone))
      return setMsg({
        tone: "bad",
        text: "Enter the phone number like 0971234567.",
      });
    const r = await rpc("update_my_details", {
      p_phone: f.phone.trim() ? normalisePhone(f.phone) : null,
      p_program: f.program,
      p_year: Number(f.year),
      p_semester: Number(f.semester),
    });
    if (r.error) return setMsg({ tone: "bad", text: r.error });
    setOpen(false);
    onSaved("Your details were updated.");
  };
  return (
    <Card style={{ marginBottom: 18 }}>
      <H>Edit my details</H>
      <p style={{ margin: "0 0 12px", color: "#aebfda", fontSize: 14 }}>
        Change your phone number, programme, year or semester. To change your
        name or student number, ask an Administrator.
      </p>
      {!open ? (
        <button type="button" style={btn} onClick={start}>
          Edit details
        </button>
      ) : (
        <form onSubmit={save}>
          {msg && <Banner tone={msg.tone}>{msg.text}</Banner>}
          <L t="Phone">
            <input
              aria-label="Phone"
              style={field}
              value={f.phone}
              onChange={(e) => setF({ ...f, phone: e.target.value })}
            />
          </L>
          <L t="Programme">
            <input
              aria-label="Programme"
              style={field}
              value={f.program}
              onChange={(e) => setF({ ...f, program: e.target.value })}
            />
          </L>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <L t="Year of study">
                <select
                  aria-label="Year of study"
                  style={field}
                  value={f.year}
                  onChange={(e) => setF({ ...f, year: e.target.value })}
                >
                  <option value="">Choose</option>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </L>
            </div>
            <div style={{ flex: 1 }}>
              <L t="Semester">
                <select
                  aria-label="Semester"
                  style={field}
                  value={f.semester}
                  onChange={(e) => setF({ ...f, semester: e.target.value })}
                >
                  <option value="">Choose</option>
                  {[1, 2].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </L>
            </div>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button type="submit" style={btn}>
              Save details
            </button>
            <button
              type="button"
              style={{
                ...btn,
                background: "transparent",
                border: "1px solid #333",
              }}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}

function Password({ prof, onSaved }) {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState(null);
  const checks = passwordChecks(pw, {
    studentNumber: prof.student_number || "",
    email: prof.email || "",
    previous: cur,
  });
  const ok = checks.every((c) => c.ok);
  const save = async (e) => {
    e.preventDefault();
    const check = await supabase.auth.signInWithPassword({
      email: prof.email,
      password: cur,
    });
    if (check.error)
      return setMsg({
        tone: "bad",
        text: "Your current password is not right.",
      });
    const u = await supabase.auth.updateUser({ password: pw });
    if (u.error) {
      return setMsg({
        tone: "bad",
        text:
          u.error.code === "same_password"
            ? "Choose a password you have not used before."
            : "The password could not be changed. Try again.",
      });
    }
    await rpc("note_password_changed");
    setOpen(false);
    setCur("");
    setPw("");
    onSaved("Your password was changed. A confirmation email is on its way.");
  };
  return (
    <Card style={{ marginBottom: 18 }}>
      <H>Change password</H>
      {!open ? (
        <button
          type="button"
          style={{ ...btn, marginTop: 8 }}
          onClick={() => {
            setOpen(true);
            setMsg(null);
          }}
        >
          Change password
        </button>
      ) : (
        <form onSubmit={save}>
          {msg && <Banner tone={msg.tone}>{msg.text}</Banner>}
          <L t="Current password">
            <input
              aria-label="Current password"
              type="password"
              autoComplete="current-password"
              style={field}
              value={cur}
              onChange={(e) => setCur(e.target.value)}
            />
          </L>
          <L t="New password">
            <input
              aria-label="New password"
              type="password"
              autoComplete="new-password"
              style={field}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
          </L>
          <ul
            style={{
              margin: "10px 0 0",
              padding: 0,
              listStyle: "none",
              fontSize: 13,
            }}
          >
            {checks.map((c) => (
              <li key={c.id} style={{ color: c.ok ? "#3ddc97" : "#8a99b3" }}>
                {c.ok ? "✓ " : "○ "}
                {c.label}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button
              type="submit"
              style={{ ...btn, opacity: ok && cur ? 1 : 0.5 }}
              disabled={!ok || !cur}
            >
              Save password
            </button>
            <button
              type="button"
              style={{
                ...btn,
                background: "transparent",
                border: "1px solid #333",
              }}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}

function Email({ prof, onSaved }) {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(null);
  const save = async (e) => {
    e.preventDefault();
    const check = await supabase.auth.signInWithPassword({
      email: prof.email,
      password: cur,
    });
    if (check.error)
      return setMsg({
        tone: "bad",
        text: "Your current password is not right.",
      });
    const r = await rpc("set_my_pending_email", { p_email: email.trim() });
    if (r.error) return setMsg({ tone: "bad", text: r.error });
    const u = await supabase.auth.updateUser({ email: email.trim() });
    if (u.error)
      return setMsg({
        tone: "bad",
        text: "The email address could not be changed. Try again.",
      });
    setOpen(false);
    setCur("");
    setEmail("");
    onSaved(
      "We sent a link to " +
        email.trim() +
        ". Your email changes after you open it.",
    );
  };
  return (
    <Card style={{ marginBottom: 18 }}>
      <H>Change email</H>
      <p style={{ margin: "0 0 12px", color: "#aebfda", fontSize: 14 }}>
        {prof.pending_email
          ? "Waiting for you to confirm " + prof.pending_email + "."
          : "You will sign in with the new address once you confirm it."}
      </p>
      {!open ? (
        <button
          type="button"
          style={btn}
          onClick={() => {
            setOpen(true);
            setMsg(null);
          }}
        >
          Change email
        </button>
      ) : (
        <form onSubmit={save}>
          {msg && <Banner tone={msg.tone}>{msg.text}</Banner>}
          <L t="New email address">
            <input
              aria-label="New email address"
              type="email"
              style={field}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </L>
          <L t="Current password">
            <input
              aria-label="Current password for email"
              type="password"
              autoComplete="current-password"
              style={field}
              value={cur}
              onChange={(e) => setCur(e.target.value)}
            />
          </L>
          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button
              type="submit"
              style={{ ...btn, opacity: email && cur ? 1 : 0.5 }}
              disabled={!email || !cur}
            >
              Send confirmation
            </button>
            <button
              type="button"
              style={{
                ...btn,
                background: "transparent",
                border: "1px solid #333",
              }}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}

/* Ask for the account to be deleted. A Super Admin decides. The records the chapter needs are kept. */
function DeleteAccount({ prof, onSaved }) {
  const [req, setReq] = useState(undefined);
  const [open, setOpen] = useState(false);
  const [why, setWhy] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const r = await rpc("my_deletion_request");
    setReq(r.error ? null : r.data || null);
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  if (prof.role === "Super Admin") {
    return (
      <Card style={{ marginBottom: 18 }}>
        <H>Delete my account</H>
        <p
          style={{
            margin: "8px 0 0",
            color: "#aebfda",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          A Super Admin cannot ask for deletion. Ask another Super Admin to
          remove your Super Admin role first.
        </p>
      </Card>
    );
  }
  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    const r = await rpc("request_account_deletion", { p_reason: why });
    setBusy(false);
    if (r.error) return setMsg({ tone: "bad", text: r.error });
    setOpen(false);
    setWhy("");
    setMsg(null);
    await load();
    onSaved("Your request was sent. A Super Admin will decide it.");
  };
  const withdraw = async () => {
    const r = await rpc("withdraw_deletion_request");
    if (r.error) return setMsg({ tone: "bad", text: r.error });
    await load();
    onSaved("Your request was withdrawn.");
  };
  const pending = req && req.status === "Pending";
  return (
    <Card style={{ marginBottom: 18 }}>
      <H>Delete my account</H>
      <p
        style={{
          margin: "8px 0 0",
          color: "#aebfda",
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        You can ask for your account to be deleted. A Super Admin decides. If it
        is approved, your sign-in, name, email, student number, phone and
        picture are erased for good. Attendance totals stay, without your name.
        You can register again later as a new member.
      </p>
      {msg && <Banner tone={msg.tone}>{msg.text}</Banner>}
      {pending ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ color: "#ffd98a", fontSize: 14, marginBottom: 10 }}>
            Your request is waiting for a Super Admin.
          </div>
          <button
            type="button"
            style={{
              ...btn,
              background: "transparent",
              border: "1px solid #333",
            }}
            onClick={withdraw}
          >
            Withdraw request
          </button>
        </div>
      ) : (
        <>
          {req && req.status === "Declined" && (
            <div
              style={{
                marginTop: 12,
                color: "#ffb3b3",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              Your last request was not approved: {req.decided_reason}
            </div>
          )}
          {!open ? (
            <button
              type="button"
              style={{
                ...btn,
                marginTop: 12,
                background: "rgba(255,107,107,0.1)",
                border: "1px solid rgba(255,107,107,0.4)",
                color: "#ffb3b3",
              }}
              onClick={() => {
                setOpen(true);
                setMsg(null);
              }}
            >
              Ask to delete my account
            </button>
          ) : (
            <form onSubmit={send}>
              <L t="Why are you leaving? (optional)">
                <textarea
                  aria-label="Reason"
                  rows={3}
                  maxLength={300}
                  style={{ ...field, resize: "vertical" }}
                  value={why}
                  onChange={(e) => setWhy(e.target.value)}
                />
              </L>
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="submit"
                  disabled={busy}
                  style={{
                    ...btn,
                    background: "rgba(255,107,107,0.1)",
                    border: "1px solid rgba(255,107,107,0.4)",
                    color: "#ffb3b3",
                    opacity: busy ? 0.5 : 1,
                  }}
                >
                  Send request
                </button>
                <button
                  type="button"
                  style={{
                    ...btn,
                    background: "transparent",
                    border: "1px solid #333",
                  }}
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </Card>
  );
}

export default function AccountCards({ prof, onSaved }) {
  return (
    <>
      <Details prof={prof} onSaved={onSaved} />
      <Password prof={prof} onSaved={onSaved} />
      <Email prof={prof} onSaved={onSaved} />
      <DeleteAccount prof={prof} onSaved={onSaved} />
    </>
  );
}
