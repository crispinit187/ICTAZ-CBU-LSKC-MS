import React from "react";

export const T = {
  bg: "#050505",
  card: "rgba(255,255,255,0.025)",
  line: "rgba(255,255,255,0.08)",
  blue: "#0066ff",
  light: "#54adff",
  muted: "#aebfda",
  dim: "#8a99b3",
  green: "#3ddc97",
  amber: "#ffb020",
  red: "#ff6b6b",
};

export const card = {
  padding: 24,
  borderRadius: 18,
  background: T.card,
  border: "1px solid " + T.line,
  boxSizing: "border-box",
};

export const input = {
  padding: "11px 14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 9,
  color: "#f1f6ff",
  fontFamily: "inherit",
  fontSize: 14,
  boxSizing: "border-box",
};

export function Btn({ kind = "ghost", children, style, ...rest }) {
  const base = {
    padding: "10px 16px",
    borderRadius: 8,
    fontFamily: "inherit",
    fontSize: 14,
    fontWeight: "bold",
    cursor: rest.disabled ? "not-allowed" : "pointer",
    opacity: rest.disabled ? 0.5 : 1,
  };
  const kinds = {
    primary: { border: "none", background: T.blue, color: "#fff" },
    ghost: {
      border: "1px solid #333",
      background: "transparent",
      color: "#fff",
    },
    approve: {
      border: "1px solid rgba(61,220,151,0.5)",
      background: "rgba(61,220,151,0.12)",
      color: "#9df0c8",
    },
    decline: {
      border: "1px solid rgba(255,107,107,0.5)",
      background: "rgba(255,107,107,0.1)",
      color: "#ffb3b3",
    },
  };
  return (
    <button
      type="button"
      className={
        kind === "primary"
          ? "btn-primary"
          : kind === "approve"
            ? "btn-approve"
            : kind === "decline"
              ? "btn-decline"
              : "btn-ghost"
      }
      style={{ ...base, ...kinds[kind], ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}

const CHIP = {
  Active: ["rgba(61,220,151,0.12)", "rgba(61,220,151,0.4)", "#9df0c8"],
  Pending: ["rgba(255,176,32,0.1)", "rgba(255,176,32,0.4)", "#ffd98a"],
  Suspended: ["rgba(255,107,107,0.1)", "rgba(255,107,107,0.4)", "#ffb3b3"],
  Deactivated: ["rgba(255,255,255,0.06)", "rgba(255,255,255,0.25)", "#aebfda"],
  Rejected: ["rgba(255,107,107,0.1)", "rgba(255,107,107,0.4)", "#ffb3b3"],
};
export function Chip({ status, children }) {
  const c = CHIP[status] || CHIP.Deactivated;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        background: c[0],
        border: "1px solid " + c[1],
        color: c[2],
        fontSize: 12,
        fontWeight: "bold",
      }}
    >
      {children || status}
    </span>
  );
}

export function Notice({ tone = "ok", children }) {
  const tones = {
    ok: ["rgba(61,220,151,0.1)", "rgba(61,220,151,0.4)", "#9df0c8"],
    error: ["rgba(255,107,107,0.1)", "rgba(255,107,107,0.4)", "#ffb3b3"],
    warn: ["rgba(255,176,32,0.08)", "rgba(255,176,32,0.35)", "#ffd98a"],
  }[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      style={{
        padding: "12px 16px",
        borderRadius: 10,
        background: tones[0],
        border: "1px solid " + tones[1],
        color: tones[2],
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}

export const th = {
  textAlign: "left",
  padding: "10px 12px",
  color: T.light,
  fontSize: 11,
  letterSpacing: 1.5,
  fontWeight: "bold",
  borderBottom: "1px solid " + T.line,
  whiteSpace: "nowrap",
};
export const td = {
  padding: "12px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  fontSize: 14,
  verticalAlign: "top",
};
