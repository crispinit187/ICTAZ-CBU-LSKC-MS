import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AuthPage,
  Banner,
  Card,
  CheckBox,
  Eyebrow,
  Field,
  PasswordInput,
  PasswordRules,
  PrimaryButton,
  TextInput,
} from "../components/auth/AuthParts.jsx";
import ConfirmDialog, { UnsavedGuard } from "../components/ConfirmDialog.jsx";
import { passwordChecks } from "../lib/password.js";

/* /first-sign-in?mode=temp|bootstrap|terms&staff=1
   temp       account created or reset by an Administrator: new password + accept documents (AU-22, AU-23, TC-05)
   bootstrap  the first Super Admin: new password + a real email address first (AU-28)
   terms      new Terms version published: accept only (TC-04)
   staff=1    adds the staff confidentiality statement (TC-06) */
const TEMP_SAMPLE = "Temp-4Kx9Qe"; // never a real password; only used so the demo can refuse reuse

export default function FirstSignIn() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const mode = ["temp", "bootstrap", "terms"].includes(params.get("mode"))
    ? params.get("mode")
    : "temp";
  const staff = params.get("staff") === "1" || mode === "bootstrap";
  const needPassword = mode !== "terms";
  const [f, setF] = useState({
    current: "",
    pw: "",
    confirm: "",
    email: "",
    terms: false,
    privacy: false,
    staff: false,
  });
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const set = (k) => (e) =>
    setF({
      ...f,
      [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  const e = {};
  if (needPassword) {
    if (!f.current)
      e.current =
        mode === "bootstrap"
          ? "Enter the initial password."
          : "Enter the temporary password you were given.";
    const checks = passwordChecks(f.pw, { previous: f.current || TEMP_SAMPLE });
    if (checks.some((c) => !c.ok))
      e.pw = "Your new password does not meet all the rules yet.";
    if (f.confirm !== f.pw) e.confirm = "The two passwords do not match.";
  }
  if (
    mode === "bootstrap" &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())
  )
    e.email = "Add a real email address. Reset links and notices go there.";
  if (!f.terms || !f.privacy) e.docs = "Please tick both boxes to continue.";
  if (staff && !f.staff)
    e.staff = "Staff must accept the confidentiality statement to continue.";
  const dirty =
    !done &&
    (f.current ||
      f.pw ||
      f.confirm ||
      f.email ||
      f.terms ||
      f.privacy ||
      f.staff);
  const shown = (k) => tried && e[k];

  const submit = (ev) => {
    ev.preventDefault();
    setTried(true);
    if (Object.keys(e).length) {
      const first = document.querySelector('[aria-invalid="true"]');
      if (first) first.focus();
      return;
    }
    setDone(true);
  };

  const signOut = (
    <button
      type="button"
      className="link-btn"
      onClick={() =>
        setConfirm({
          title: "Sign out?",
          body: "You have not finished setting up your account. You will need to sign in again to continue.",
          warning: dirty ? "What you have typed here will be discarded." : null,
          confirmLabel: "Sign out",
          tone: "info",
          run: () => nav("/login"),
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
      }}
    >
      Sign out
    </button>
  );

  const titles = {
    temp: [
      "Set your new password",
      "An Administrator created or reset your account with a temporary password. Choose your own password before you continue.",
    ],
    bootstrap: [
      "Secure the first Super Admin account",
      "This account starts with an initial password and no email address. Set a new password and add a real email address before you do anything else.",
    ],
    terms: [
      "We updated our terms",
      "Please read and accept the new version to keep using the system. Nothing else has changed on your account.",
    ],
  }[mode];

  if (done) {
    return (
      <AuthPage width={520} right={<span />}>
        <Card
          className="rise"
          style={{ textAlign: "center", padding: "40px 28px" }}
        >
          <div
            style={{
              width: 84,
              height: 84,
              margin: "0 auto",
              borderRadius: "50%",
              background: "rgba(61,220,151,0.12)",
              border: "2px solid rgba(61,220,151,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="42"
              height="42"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3ddc97"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </div>
          <h1
            style={{
              margin: "22px 0 10px",
              fontSize: 28,
              letterSpacing: "-1px",
            }}
          >
            You are all set
          </h1>
          <p
            style={{
              margin: "0 0 24px",
              color: "#aebfda",
              fontSize: 15,
              lineHeight: 1.7,
            }}
          >
            {needPassword
              ? "Your password has been changed and your other sessions were signed out. We emailed you a notice. "
              : ""}
            Your acceptance was recorded with the version and the time.
          </p>
          <PrimaryButton
            type="button"
            onClick={() => nav(staff ? "/admin" : "/scan")}
          >
            Continue
          </PrimaryButton>
        </Card>
      </AuthPage>
    );
  }

  return (
    <AuthPage width={600} right={signOut}>
      <UnsavedGuard active={!!dirty} />
      <Eyebrow>{mode === "terms" ? "UPDATED TERMS" : "FIRST SIGN-IN"}</Eyebrow>
      <h1
        style={{
          margin: "10px 0 8px",
          fontSize: 36,
          lineHeight: 1.05,
          letterSpacing: "-1.4px",
        }}
      >
        {titles[0]}
      </h1>
      <p
        style={{
          margin: "0 0 24px",
          color: "#aebfda",
          fontSize: 15,
          lineHeight: 1.7,
        }}
      >
        {titles[1]}
      </p>
      <Card>
        {needPassword && mode === "temp" && (
          <Banner tone="warn">
            A temporary password works for 48 hours after it was issued and only
            until you change it.
          </Banner>
        )}
        <form onSubmit={submit} noValidate>
          {needPassword && (
            <>
              <Field
                id="current"
                label={
                  mode === "bootstrap"
                    ? "Initial password"
                    : "Temporary password"
                }
                error={shown("current")}
              >
                <PasswordInput
                  id="current"
                  value={f.current}
                  onChange={set("current")}
                  error={shown("current")}
                  autoComplete="current-password"
                />
              </Field>
              {mode === "bootstrap" && (
                <Field
                  id="email"
                  label="Your real email address"
                  error={shown("email")}
                  hint="We send a confirmation link here. Until you confirm it, the account stays in setup."
                >
                  <TextInput
                    id="email"
                    type="email"
                    value={f.email}
                    onChange={set("email")}
                    error={shown("email")}
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck="false"
                  />
                </Field>
              )}
              <Field id="pw" label="New password" error={shown("pw")}>
                <PasswordInput
                  id="pw"
                  value={f.pw}
                  onChange={set("pw")}
                  error={shown("pw")}
                  autoComplete="new-password"
                />
              </Field>
              <PasswordRules
                password={f.pw}
                ctx={{ email: f.email, previous: f.current || TEMP_SAMPLE }}
              />
              <Field
                id="confirm"
                label="Confirm new password"
                error={shown("confirm")}
              >
                <PasswordInput
                  id="confirm"
                  value={f.confirm}
                  onChange={set("confirm")}
                  error={shown("confirm")}
                  autoComplete="new-password"
                />
              </Field>
            </>
          )}

          <div
            style={{ margin: "6px 0 10px", fontSize: 14, fontWeight: "bold" }}
          >
            Documents
          </div>
          <CheckBox
            id="terms"
            checked={f.terms}
            onChange={set("terms")}
            error={null}
          >
            I accept the{" "}
            <Link to="/terms" target="_blank">
              Terms of Use
            </Link>{" "}
            <span style={{ color: "#75859e" }}>(version 2)</span>.
          </CheckBox>
          <CheckBox
            id="privacy"
            checked={f.privacy}
            onChange={set("privacy")}
            error={shown("docs") && !staff ? e.docs : null}
          >
            I accept the{" "}
            <Link to="/privacy" target="_blank">
              Privacy Notice
            </Link>{" "}
            <span style={{ color: "#75859e" }}>(version 2)</span>.
          </CheckBox>
          {staff && (
            <CheckBox
              id="staffc"
              checked={f.staff}
              onChange={set("staff")}
              error={shown("staff")}
            >
              <strong>Staff confidentiality.</strong> I will use member data
              only for chapter business and will not share it.
            </CheckBox>
          )}
          {shown("docs") && staff && (
            <div
              role="alert"
              style={{ margin: "0 0 14px", fontSize: 13, color: "#ffb3b3" }}
            >
              {e.docs}
            </div>
          )}

          <div style={{ marginTop: 22 }}>
            <PrimaryButton type="submit">
              {needPassword ? "Save and continue" : "Accept and continue"}
            </PrimaryButton>
          </div>
        </form>
      </Card>
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
