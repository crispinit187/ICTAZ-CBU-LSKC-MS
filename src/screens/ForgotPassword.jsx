import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AuthPage,
  BackLink,
  Banner,
  Card,
  Eyebrow,
  Field,
  PrimaryButton,
  TextInput,
} from "../components/auth/AuthParts.jsx";
import { configured, demoOpen, supabase } from "../lib/supabase.js";

/* Step 1 of a password reset (SRS 7.4). The reply is always the same, whether or not an
   account matches, so nobody can use this page to find out who is registered (AU-19). */
const DELAY = 30; // demo value; the real delay is set by a Super Admin (section 7.6)

export default function ForgotPassword() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [id, setId] = useState(params.get("id") || "");
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const [tries, setTries] = useState(0);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const real = configured && !demoOpen;
  const [busy, setBusy] = useState(false);

  // The reply is the same whether or not an account matches (AU-19).
  const sendReal = async (v) => {
    const redirectTo =
      window.location.origin + import.meta.env.BASE_URL + "reset-password";
    if (/^\d{8}$/.test(v)) {
      const r = await supabase.functions.invoke("forgot-password", {
        body: { identifier: v, redirectTo },
      });
      if (r.error) {
        const status = r.error.context && r.error.context.status;
        if (status === 429) return { limited: true };
        return {
          error:
            "Reset by student number is not switched on yet. Use the email on your account.",
        };
      }
      return {};
    }
    const r = await supabase.auth.resetPasswordForEmail(v, { redirectTo });
    if (
      r.error &&
      (r.error.status === 429 || /rate/i.test(r.error.message || ""))
    )
      return { limited: true };
    return {};
  };

  const submit = async (e) => {
    e.preventDefault();
    if (wait > 0 || busy) return;
    const v = id.trim();
    if (!/^\d{8}$/.test(v) && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      setError(
        "Enter your 8-digit student number or the email on your account.",
      );
      const el = document.getElementById("identifier");
      if (el) el.focus();
      return;
    }
    setError(null);
    if (real) {
      setBusy(true);
      let res = {};
      try {
        res = await sendReal(v);
      } catch (err) {
        res = {
          error:
            "We could not reach the service. Check your connection and try again.",
        };
      }
      setBusy(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.limited) {
        setWait(DELAY);
        return;
      }
    }
    const n = tries + 1;
    setTries(n);
    setSent(true);
    if (n >= 5) setWait(DELAY);
    else setWait(15); // short pause before a resend
  };

  if (sent) {
    return (
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
              background: "rgba(84,173,255,0.12)",
              border: "2px solid rgba(84,173,255,0.5)",
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
              stroke="#54adff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>
          </div>
          <h1
            style={{
              margin: "22px 0 10px",
              fontSize: 28,
              letterSpacing: "-1px",
            }}
          >
            Check your email
          </h1>
          <p
            style={{
              margin: 0,
              color: "#aebfda",
              fontSize: 15,
              lineHeight: 1.7,
            }}
          >
            If an account matches, we have sent a reset link to the email on it.
            The link works <strong style={{ color: "#fff" }}>once</strong> and
            expires in <strong style={{ color: "#fff" }}>1 hour</strong>.
          </p>
          <p
            style={{
              margin: "14px 0 24px",
              color: "#75859e",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            Nothing arrived? Check your spam folder. If you registered with
            Google only, sign in with Google instead.
          </p>
          <PrimaryButton type="button" onClick={() => nav("/login")}>
            Back to sign in
          </PrimaryButton>
          <button
            type="button"
            className="link-btn"
            disabled={wait > 0}
            onClick={() => setSent(false)}
            style={{
              marginTop: 16,
              background: "none",
              border: "none",
              color: wait > 0 ? "#75859e" : "#54adff",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 600,
              cursor: wait > 0 ? "not-allowed" : "pointer",
            }}
          >
            {wait > 0 ? `Send again in ${wait} seconds` : "Send it again"}
          </button>
        </Card>
      </AuthPage>
    );
  }

  return (
    <AuthPage width={520}>
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
        Forgot your password?
      </h1>
      <p
        style={{
          margin: "0 0 24px",
          color: "#aebfda",
          fontSize: 15,
          lineHeight: 1.7,
        }}
      >
        Enter your student number or email. We will send a link to the email on
        your account so you can choose a new password.
      </p>
      <Card>
        {wait > 0 && (
          <Banner tone="warn">
            <strong>Too many attempts.</strong> For your protection, wait {wait}{" "}
            seconds before trying again.
          </Banner>
        )}
        <form onSubmit={submit} noValidate>
          <Field id="identifier" label="Student number or email" error={error}>
            <TextInput
              id="identifier"
              value={id}
              onChange={(e) => setId(e.target.value)}
              error={error}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              placeholder="e.g. 23144450 or name@gmail.com"
            />
          </Field>
          <PrimaryButton type="submit" disabled={wait > 0 || busy}>
            {busy
              ? "Sending..."
              : wait > 0
                ? `Try again in ${wait}s`
                : "Send reset link"}
          </PrimaryButton>
        </form>
        <p
          style={{
            margin: "20px 0 0",
            textAlign: "center",
            color: "#75859e",
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          Accounts that are still waiting for approval, or are suspended, cannot
          use a reset link to get in.
        </p>
      </Card>
    </AuthPage>
  );
}
