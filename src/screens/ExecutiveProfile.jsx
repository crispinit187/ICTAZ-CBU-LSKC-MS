import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AuthPage,
  BackLink,
  Banner,
  Card,
  Eyebrow,
} from "../components/auth/AuthParts.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { Splash } from "../auth/guards.jsx";
import AccountCards from "../components/AccountCards.jsx";
import { homeFor, useAuth } from "../auth/AuthProvider.jsx";
import { live, rpc } from "../lib/api.js";

// Sample data for the design demo. The real values come from the member record and executive profile.
const ME = {
  name: "Namukolo Siame",
  initials: "NS",
  position: "Vice President",
  since: "January 2026",
  role: "Registrar",
  studentNumber: "22118899",
  email: "namukolo.s@gmail.com",
  phone: "+260 97 000 0000",
  program: "Computer Engineering",
  year: "3,1",
};

const stamp = () =>
  new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function Gate({ label, on, note }) {
  return (
    <div
      style={{
        flex: "1 1 200px",
        padding: "14px 16px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          color: "#8a99b3",
          fontSize: 11,
          fontWeight: "bold",
          letterSpacing: 1.5,
        }}
      >
        {label}
      </div>
      <div
        style={{
          margin: "6px 0 4px",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontWeight: "bold",
          fontSize: 15,
          color: on ? "#9df0c8" : "#aebfda",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: on ? "#3ddc97" : "#75859e",
          }}
        />
        {on ? "On" : "Off"}
      </div>
      <div style={{ color: "#75859e", fontSize: 12, lineHeight: 1.5 }}>
        {note}
      </div>
    </div>
  );
}

export default function ExecutiveProfile() {
  const nav = useNavigate();
  const auth = useAuth();
  const [consent, setConsent] = useState(false);
  const [adminDisplay, setAdminDisplay] = useState(false);
  const [changed, setChanged] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoErr, setPhotoErr] = useState(null);
  const file = useRef(null);
  const real = live();
  const [prof, setProf] = useState(null);
  const reload = () =>
    rpc("my_profile").then((r) => {
      if (r.error) return;
      setProf(r.data);
      setConsent(!!r.data.consent);
      setAdminDisplay(!!(r.data.executive && r.data.executive.public_display));
    });
  useEffect(() => {
    if (!real) return;
    reload();
  }, [real]);
  const initialsOf = (n) =>
    String(n || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0].toUpperCase())
      .join("");
  const me = prof
    ? {
        name: prof.name,
        initials: initialsOf(prof.name),
        position: prof.executive ? prof.executive.position : "",
        since: prof.executive
          ? new Date(prof.executive.since).toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })
          : "",
        role: prof.role,
        studentNumber: prof.student_number,
        email: prof.email,
        phone: prof.phone || "Not given",
        program: prof.program || "—",
        year:
          (prof.year_of_study || "—") + "," + (prof.semester_of_study || "—"),
      }
    : ME;
  const isExec = !real || !!(prof && prof.executive);

  const visible = consent && adminDisplay;

  const askToggle = () => {
    if (!consent) {
      setConfirm({
        title: "Allow your information to be published?",
        body: "If an Administrator then turns display on, the public page will show your name, position, programme and picture. Nothing else is published.",
        confirmLabel: "Yes, allow it",
        tone: "info",
        run: async () => {
          if (real) {
            const r = await rpc("set_my_consent", { p_consent: true });
            if (r.error) return setToast({ tone: "bad", text: r.error });
          }
          setConsent(true);
          setChanged(stamp());
          setToast({
            tone: "ok",
            text: "Saved. Your consent is Yes. Nothing is public until an Administrator turns display on. The change is in the audit log.",
          });
        },
      });
    } else {
      setConfirm({
        title: "Withdraw your consent?",
        body: "Your information stops being public immediately, even if an Administrator had display turned on.",
        confirmLabel: "Withdraw consent",
        tone: "danger",
        run: async () => {
          if (real) {
            const r = await rpc("set_my_consent", { p_consent: false });
            if (r.error) return setToast({ tone: "bad", text: r.error });
          }
          setConsent(false);
          setAdminDisplay(false);
          setChanged(stamp());
          setToast({
            tone: "info",
            text: "Saved. Your consent is No and public display is off. The change is in the audit log.",
          });
        },
      });
    }
  };

  const pickPhoto = (ev) => {
    const fl = ev.target.files && ev.target.files[0];
    if (!fl) return;
    if (!/^image\/(jpeg|png)$/.test(fl.type))
      return setPhotoErr("Choose a JPG or PNG picture.");
    if (fl.size > 2 * 1024 * 1024)
      return setPhotoErr("That picture is over 2 MB. Choose a smaller one.");
    setPhotoErr(null);
    setPhoto(URL.createObjectURL(fl));
    setToast({
      tone: "ok",
      text: "Picture updated. Pictures are stored privately and only shown publicly when both settings below are on.",
    });
  };

  const signOut = (
    <div style={{ display: "flex", gap: 20, fontSize: 14, fontWeight: 600 }}>
      <Link to="/scan" style={{ color: "#aaaaaa" }}>
        Scan
      </Link>
      <span aria-current="page" style={{ color: "#fff" }}>
        My account
      </span>
      <button
        type="button"
        className="link-btn"
        onClick={() =>
          setConfirm({
            title: "Sign out?",
            body: "You will need to sign in again to continue.",
            confirmLabel: "Sign out",
            tone: "info",
            run: async () => {
              await auth.signOut();
              nav("/login", { replace: true });
            },
          })
        }
        style={{
          background: "none",
          border: "none",
          color: "#54adff",
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          padding: 0,
        }}
      >
        Sign out
      </button>
    </div>
  );

  const row = (k, v) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        fontSize: 14,
      }}
    >
      <span style={{ color: "#8a99b3" }}>{k}</span>
      <span style={{ textAlign: "right" }}>{v}</span>
    </div>
  );

  const home = real ? homeFor(auth.ctx) : "/scan";
  if (real && !prof) return <Splash />;

  return (
    <AuthPage width={720} right={signOut}>
      <BackLink
        label={
          home === "/admin"
            ? "Back to dashboard"
            : home === "/registrar"
              ? "Back to marking"
              : "Back to scan"
        }
        to={home}
      />
      <Eyebrow>MY ACCOUNT</Eyebrow>
      <h1
        style={{
          margin: "10px 0 22px",
          fontSize: 36,
          lineHeight: 1.05,
          letterSpacing: "-1.4px",
        }}
      >
        {isExec ? "Executive profile" : "My account"}
      </h1>

      <div aria-live="polite">
        {toast && <Banner tone={toast.tone}>{toast.text}</Banner>}
      </div>

      <Card style={{ marginBottom: 18 }}>
        <div
          style={{
            display: "flex",
            gap: 20,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {photo ? (
            <img
              src={photo}
              alt="Your profile picture"
              style={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid rgba(84,173,255,0.5)",
              }}
            />
          ) : (
            <div
              aria-hidden="true"
              style={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#0066ff,#003d99)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 30,
                fontWeight: "bold",
              }}
            >
              {me.initials}
            </div>
          )}
          <div style={{ flex: "1 1 220px" }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: "bold",
                letterSpacing: "-0.5px",
              }}
            >
              {me.name}
            </div>
            <div
              style={{ margin: "4px 0 10px", color: "#aebfda", fontSize: 14 }}
            >
              {me.position
                ? me.position + " · current since " + me.since
                : "Chapter member"}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  padding: "4px 11px",
                  borderRadius: 20,
                  background: "rgba(61,220,151,0.12)",
                  border: "1px solid rgba(61,220,151,0.4)",
                  color: "#9df0c8",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                Active member
              </span>
              <span
                style={{
                  padding: "4px 11px",
                  borderRadius: 20,
                  background: "rgba(255,176,32,0.12)",
                  border: "1px solid rgba(255,176,32,0.45)",
                  color: "#ffd98a",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                {me.role}
              </span>
            </div>
          </div>
          {!real && (
            <div>
              <input
                ref={file}
                type="file"
                accept="image/jpeg,image/png"
                onChange={pickPhoto}
                style={{ display: "none" }}
                aria-label="Choose a profile picture"
              />
              <button
                type="button"
                className="btn-ghost"
                onClick={() => file.current && file.current.click()}
                style={{
                  padding: "11px 18px",
                  border: "1px solid #333333",
                  borderRadius: 8,
                  background: "transparent",
                  color: "#ffffff",
                  fontFamily: "inherit",
                  fontSize: 14,
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Change picture
              </button>
            </div>
          )}
        </div>
        {photoErr && (
          <div
            role="alert"
            style={{ marginTop: 12, fontSize: 13, color: "#ffb3b3" }}
          >
            {photoErr}
          </div>
        )}
        {!real && (
          <div style={{ marginTop: 8, color: "#75859e", fontSize: 12 }}>
            JPG or PNG, up to 2 MB.
          </div>
        )}
      </Card>

      {isExec && (
        <Card style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 20, letterSpacing: "-0.4px" }}>
            Public display
          </h2>
          <p
            style={{
              margin: "8px 0 18px",
              color: "#aebfda",
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            The chapter may list its current executives on a public page. That
            needs two things:{" "}
            <strong style={{ color: "#fff" }}>your consent</strong>, and then an{" "}
            <strong style={{ color: "#fff" }}>
              Administrator turning display on
            </strong>
            . Neither is enough alone.
          </p>
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              padding: "16px 18px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.035)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ flexGrow: 1 }}>
              <div
                id="consent-label"
                style={{ fontWeight: "bold", fontSize: 15 }}
              >
                Allow my information to be published to the public
              </div>
              <div
                id="consent-desc"
                style={{
                  marginTop: 4,
                  color: "#8a99b3",
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                {changed
                  ? `Last changed ${changed}.`
                  : "Off by default. This setting belongs to you and carries over to any new position."}
              </div>
            </div>
            <span
              style={{
                fontWeight: "bold",
                fontSize: 14,
                color: consent ? "#9df0c8" : "#aebfda",
              }}
            >
              {consent ? "Yes" : "No"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={consent}
              aria-labelledby="consent-label"
              aria-describedby="consent-desc"
              className="switch"
              onClick={askToggle}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 14,
            }}
          >
            <Gate label="YOUR CONSENT" on={consent} note="You control this." />
            <Gate
              label="ADMINISTRATOR DISPLAY"
              on={adminDisplay}
              note={
                consent
                  ? "Set by an Administrator, off until they turn it on."
                  : "Cannot be turned on while your consent is No."
              }
            />
            <Gate
              label="SHOWN PUBLICLY"
              on={visible}
              note={
                visible
                  ? "Your name, position, programme and picture are on the public page."
                  : "You are not on the public page."
              }
            />
          </div>

          {!real && (
            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="btn-ghost"
                disabled={!consent || adminDisplay}
                title={
                  consent
                    ? "Demo only: simulates the Administrator"
                    : "An Administrator can turn display on only while your consent is Yes"
                }
                onClick={() => {
                  setAdminDisplay(true);
                  setToast({
                    tone: "info",
                    text: "An Administrator turned display on. You are now on the public page. Withdraw your consent at any time to remove yourself immediately.",
                  });
                }}
                style={{
                  padding: "10px 16px",
                  border: "1px solid #333333",
                  borderRadius: 8,
                  background: "transparent",
                  color: "#ffffff",
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: "bold",
                  cursor: !consent || adminDisplay ? "not-allowed" : "pointer",
                  opacity: !consent || adminDisplay ? 0.5 : 1,
                }}
              >
                Demo: Administrator turns display on
              </button>
              <span style={{ color: "#75859e", fontSize: 12 }}>
                Only for this design demo.
              </span>
            </div>
          )}
        </Card>
      )}

      <Card style={{ marginBottom: 18 }}>
        <h2
          style={{ margin: "0 0 4px", fontSize: 20, letterSpacing: "-0.4px" }}
        >
          Who can see what
        </h2>
        <p
          style={{
            margin: "0 0 14px",
            color: "#aebfda",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          Your details are limited by role, whatever you choose above.
        </p>
        {[
          ["Members and Registrars", "Name, position, programme and picture"],
          [
            "Reviewers and Administrators",
            "Full details: student number, email, phone, year of study and the rest",
          ],
          [
            "The public",
            visible
              ? "Name, position, programme and picture (you are listed now)"
              : "Nothing. You are not listed",
          ],
        ].map(([who, what]) => (
          <div
            key={who}
            style={{
              padding: "11px 0",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            <strong>{who}</strong>
            <div style={{ color: "#aebfda" }}>{what}</div>
          </div>
        ))}
      </Card>

      <Card>
        <h2
          style={{ margin: "0 0 8px", fontSize: 20, letterSpacing: "-0.4px" }}
        >
          Your details
        </h2>
        {row("Student number", me.studentNumber)}
        {row("Email", me.email)}
        {row("Phone", me.phone)}
        {row("Programme", me.program)}
        {row("Year and semester", me.year)}
        <p
          style={{
            margin: "14px 0 0",
            color: "#75859e",
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          {real
            ? "To change your name or student number, ask an Administrator."
            : "Sample data for the design demo. Editing details and changing your password will be on this page."}
        </p>
      </Card>

      {real && prof && (
        <AccountCards
          prof={prof}
          onSaved={(text) => {
            setToast({ tone: "ok", text });
            reload();
          }}
        />
      )}

      {confirm && (
        <ConfirmDialog
          cfg={confirm}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const c = confirm;
            setConfirm(null);
            c.run();
          }}
        />
      )}
    </AuthPage>
  );
}
