import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { passwordChecks } from "../../lib/password.js";
import { Framed } from "../admin/adminChrome.js";

export const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px 15px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "9px",
  color: "#f1f6ff",
  fontFamily: "inherit",
  fontSize: "15px",
};

export function AuthPage({ children, right, width = 600 }) {
  const framed = useContext(Framed);
  if (framed)
    return (
      <div
        className="scr-auth"
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "32px 16px 56px",
          color: "#ffffff",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ width: "100%", maxWidth: width }}>{children}</div>
      </div>
    );
  return (
    <div
      className="scr-auth"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#050505",
        color: "#ffffff",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <nav
        style={{
          minHeight: 70,
          padding: "0 6%",
          boxSizing: "border-box",
          background: "#000000",
          borderBottom: "1px solid #1c1c1c",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Link
          to="/login"
          style={{
            fontSize: 21,
            fontWeight: "bold",
            letterSpacing: "-0.5px",
            color: "#ffffff",
          }}
        >
          ICTAZ <span style={{ color: "#0066ff" }}>CBU</span>
        </Link>
        {right || (
          <div
            style={{ display: "flex", gap: 24, fontSize: 14, fontWeight: 600 }}
          >
            <Link to="/terms" style={{ color: "#aaaaaa" }}>
              Terms of Use
            </Link>
            <Link to="/privacy" style={{ color: "#aaaaaa" }}>
              Privacy Notice
            </Link>
          </div>
        )}
      </nav>
      <main
        style={{
          flexGrow: 1,
          display: "flex",
          justifyContent: "center",
          padding: "40px 16px 56px",
          background:
            "radial-gradient(circle at 85% 0%, rgba(0,102,255,0.2), transparent 40%), #050505",
        }}
      >
        <div style={{ width: "100%", maxWidth: width }}>{children}</div>
      </main>
    </div>
  );
}

export function Card({ children, style, className }) {
  return (
    <section
      className={className}
      style={{
        padding: "28px 28px 30px",
        borderRadius: 18,
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.08)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children }) {
  return (
    <div
      style={{
        color: "#54adff",
        fontSize: 12,
        fontWeight: "bold",
        letterSpacing: 2,
      }}
    >
      {children}
    </div>
  );
}

export function Field({ id, label, optional, hint, error, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label
        htmlFor={id}
        style={{
          display: "block",
          marginBottom: 7,
          fontSize: 14,
          fontWeight: "bold",
        }}
      >
        {label}
        {optional && (
          <span
            style={{
              marginLeft: 8,
              color: "#75859e",
              fontWeight: "normal",
              fontSize: 12,
            }}
          >
            Optional
          </span>
        )}
      </label>
      {children}
      {error ? (
        <div
          id={id + "-msg"}
          role="alert"
          style={{ marginTop: 7, fontSize: 13, color: "#ffb3b3" }}
        >
          {error}
        </div>
      ) : hint ? (
        <div
          id={id + "-msg"}
          style={{
            marginTop: 7,
            fontSize: 12,
            color: "#75859e",
            lineHeight: 1.5,
          }}
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export function TextInput({ id, error, style, ...rest }) {
  return (
    <input
      id={id}
      className="field"
      aria-invalid={error ? "true" : undefined}
      aria-describedby={id + "-msg"}
      style={{
        ...inputStyle,
        borderColor: error ? "rgba(255,107,107,0.6)" : undefined,
        ...style,
      }}
      {...rest}
    />
  );
}

export function PasswordInput({
  id,
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
  onBlur,
}) {
  const [show, setShow] = React.useState(false);
  return (
    <div style={{ position: "relative" }}>
      <TextInput
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        error={error}
        autoComplete={autoComplete}
        placeholder={placeholder}
        style={{ paddingRight: 76 }}
      />
      <button
        type="button"
        className="link-btn"
        aria-label={show ? "Hide password" : "Show password"}
        onClick={() => setShow(!show)}
        style={{
          position: "absolute",
          right: 6,
          top: 6,
          bottom: 6,
          padding: "0 12px",
          background: "transparent",
          border: "none",
          borderRadius: 7,
          color: "#aebfda",
          fontFamily: "inherit",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export function PasswordRules({ password, ctx }) {
  const checks = passwordChecks(password, ctx);
  return (
    <ul
      aria-live="polite"
      style={{
        listStyle: "none",
        margin: "0 0 18px",
        padding: "12px 14px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "grid",
        gap: 6,
      }}
    >
      {checks.map((c) => (
        <li
          key={c.id}
          style={{
            display: "flex",
            gap: 9,
            alignItems: "flex-start",
            fontSize: 13,
            lineHeight: 1.4,
            color: c.ok ? "#9df0c8" : "#aebfda",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              flexShrink: 0,
              width: 16,
              textAlign: "center",
              fontWeight: "bold",
              color: c.ok ? "#3ddc97" : "#75859e",
            }}
          >
            {c.ok ? "✓" : "•"}
          </span>
          <span>
            {c.label}
            <span style={{ position: "absolute", left: -9999 }}>
              {c.ok ? " (met)" : " (not met yet)"}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Banner({ tone = "info", children }) {
  const t = {
    info: ["rgba(84,173,255,0.1)", "rgba(84,173,255,0.4)", "#bcd6ff"],
    ok: ["rgba(61,220,151,0.1)", "rgba(61,220,151,0.4)", "#9df0c8"],
    warn: ["rgba(255,176,32,0.1)", "rgba(255,176,32,0.4)", "#ffd98a"],
    bad: ["rgba(255,107,107,0.1)", "rgba(255,107,107,0.4)", "#ffb3b3"],
  }[tone];
  return (
    <div
      role="status"
      style={{
        marginBottom: 18,
        padding: "12px 14px",
        borderRadius: 10,
        background: t[0],
        border: "1px solid " + t[1],
        color: t[2],
        fontSize: 13,
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}

export function PrimaryButton({ children, ...rest }) {
  return (
    <button
      className="btn-primary"
      style={{
        width: "100%",
        padding: "15px 24px",
        border: "none",
        borderRadius: 8,
        background: "#0066ff",
        color: "#ffffff",
        fontFamily: "inherit",
        fontSize: 15,
        fontWeight: "bold",
        cursor: "pointer",
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function GoogleButton({ children, ...rest }) {
  return (
    <button
      type="button"
      className="btn-google"
      style={{
        width: "100%",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        background: "transparent",
        border: "1px solid #333333",
        borderRadius: 8,
        color: "#ffffff",
        fontFamily: "inherit",
        fontSize: 15,
        fontWeight: "bold",
        cursor: "pointer",
      }}
      {...rest}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78l4.01-3.1z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.28 6.61l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75z"
        />
      </svg>
      <span>{children}</span>
    </button>
  );
}

export function CheckBox({ id, checked, onChange, error, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        htmlFor={id}
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          fontSize: 14,
          lineHeight: 1.6,
          color: "#d6e2f5",
          cursor: "pointer",
        }}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          aria-describedby={id + "-msg"}
          style={{
            marginTop: 4,
            width: 18,
            height: 18,
            accentColor: "#0066ff",
            flexShrink: 0,
          }}
        />
        <span>{children}</span>
      </label>
      {error && (
        <div
          id={id + "-msg"}
          role="alert"
          style={{
            marginTop: 6,
            marginLeft: 30,
            fontSize: 13,
            color: "#ffb3b3",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

/* Back link above the page title. history=true goes back one step when the person
   arrived from another page in this app, otherwise to `to`. guard(go) may intercept. */
export function BackLink({ label, to, history = false, guard }) {
  const nav = useNavigate();
  const go = () => {
    const idx = window.history.state && window.history.state.idx;
    if (history && idx > 0) nav(-1);
    else nav(to);
  };
  return (
    <a
      href={to}
      onClick={(e) => {
        e.preventDefault();
        if (guard) guard(go);
        else go();
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 22,
        padding: "6px 2px",
        color: "#aebfda",
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M15 5l-7 7 7 7" />
      </svg>
      {label}
    </a>
  );
}
