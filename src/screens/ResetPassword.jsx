import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AuthPage,
  BackLink,
  Card,
  Eyebrow,
  Field,
  PasswordInput,
  PasswordRules,
  PrimaryButton,
} from "../components/auth/AuthParts.jsx";
import { UnsavedGuard } from "../components/ConfirmDialog.jsx";
import { passwordChecks } from "../lib/password.js";

/* Step 2: the page the emailed link opens (SRS 7.4, AU-21, AU-24).
   Demo option: /reset-password?state=valid|expired. The real page checks the link's token on the server. */
export default function ResetPassword() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const expired = params.get("state") === "expired";
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(false);

  const bad = passwordChecks(pw).some((c) => !c.ok);
  const errPw =
    tried && bad ? "Your new password does not meet all the rules yet." : null;
  const errConfirm =
    tried && confirm !== pw ? "The two passwords do not match." : null;

  const submit = (e) => {
    e.preventDefault();
    setTried(true);
    if (bad || confirm !== pw) {
      requestAnimationFrame(() => {
        const first = document.querySelector('[aria-invalid="true"]');
        if (first) first.focus();
      });
      return;
    }
    setDone(true);
  };

  const iconCard = (tone, path, title, body, button) => (
    <AuthPage width={520}>
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
            background: tone[0],
            border: "2px solid " + tone[1],
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
            stroke={tone[2]}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={path} />
          </svg>
        </div>
        <h1
          style={{ margin: "22px 0 10px", fontSize: 28, letterSpacing: "-1px" }}
        >
          {title}
        </h1>
        <p
          style={{
            margin: "0 0 24px",
            color: "#aebfda",
            fontSize: 15,
            lineHeight: 1.7,
          }}
        >
          {body}
        </p>
        {button}
      </Card>
    </AuthPage>
  );

  if (expired) {
    return iconCard(
      ["rgba(255,176,32,0.12)", "rgba(255,176,32,0.5)", "#ffb020"],
      "M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
      "This link no longer works",
      "Reset links work once and expire after 1 hour. This one has either been used or has run out. Ask for a new one.",
      <PrimaryButton type="button" onClick={() => nav("/forgot-password")}>
        Get a new link
      </PrimaryButton>,
    );
  }
  if (done) {
    return iconCard(
      ["rgba(61,220,151,0.12)", "rgba(61,220,151,0.5)", "#3ddc97"],
      "M5 12.5l4.5 4.5L19 7.5",
      "Password changed",
      "Your other sessions were signed out and we emailed you a notice. Sign in with your new password.",
      <PrimaryButton type="button" onClick={() => nav("/login")}>
        Sign in
      </PrimaryButton>,
    );
  }

  return (
    <AuthPage width={520}>
      <UnsavedGuard active={!!(pw || confirm)} />
      <BackLink label="Back to sign in" to="/login" />
      <Eyebrow>PASSWORD</Eyebrow>
      <h1
        style={{
          margin: "10px 0 8px",
          fontSize: 36,
          lineHeight: 1.05,
          letterSpacing: "-1.4px",
        }}
      >
        Choose a new password
      </h1>
      <p
        style={{
          margin: "0 0 24px",
          color: "#aebfda",
          fontSize: 15,
          lineHeight: 1.7,
        }}
      >
        Pick a password you have not used here before. After you save it, every
        other device is signed out.
      </p>
      <Card>
        <form onSubmit={submit} noValidate>
          <Field id="pw" label="New password" error={errPw}>
            <PasswordInput
              id="pw"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              error={errPw}
              autoComplete="new-password"
            />
          </Field>
          <PasswordRules password={pw} />
          <Field id="confirm" label="Confirm new password" error={errConfirm}>
            <PasswordInput
              id="confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={errConfirm}
              autoComplete="new-password"
            />
          </Field>
          <div style={{ marginTop: 22 }}>
            <PrimaryButton type="submit">Save new password</PrimaryButton>
          </div>
        </form>
      </Card>
    </AuthPage>
  );
}
