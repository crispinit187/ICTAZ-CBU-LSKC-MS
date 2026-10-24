import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/* A message that pops up at the top of the screen, wherever the page is scrolled.
   Success and info messages close by themselves after 5 seconds. Errors stay until closed.
   `sig` changes when there is a new message (a text, or the message object itself). */
const TONES = {
  ok: ["#0b2a1d", "rgba(61,220,151,0.55)", "#9df0c8"],
  info: ["#0a2038", "rgba(84,173,255,0.55)", "#bcd6ff"],
  error: ["#341212", "rgba(255,107,107,0.6)", "#ffb3b3"],
  warn: ["#33240a", "rgba(255,176,32,0.55)", "#ffd98a"],
};

const textOf = (children) =>
  React.Children.toArray(children)
    .map((c) => (typeof c === "string" || typeof c === "number" ? c : "·"))
    .join("|");

export default function Toast({ tone = "ok", sig, children }) {
  const kind = tone === "bad" || tone === "danger" ? "error" : tone;
  const [gone, setGone] = useState(false);
  const key = sig === undefined ? textOf(children) : sig;
  useEffect(() => {
    setGone(false);
    if (kind === "error") return undefined;
    const t = setTimeout(() => setGone(true), 5000);
    return () => clearTimeout(t);
  }, [key, kind]);
  if (gone) return null;
  const c = TONES[kind] || TONES.ok;
  return createPortal(
    <div className="toast-pop" role={kind === "error" ? "alert" : "status"}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          maxWidth: 560,
          margin: "0 auto",
          boxSizing: "border-box",
          padding: "12px 12px 12px 16px",
          borderRadius: 12,
          background: c[0],
          border: "1px solid " + c[1],
          color: c[2],
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: 14,
          lineHeight: 1.5,
          boxShadow: "0 10px 40px rgba(0,0,0,0.55)",
        }}
      >
        <div style={{ flex: "1 1 auto", minWidth: 0 }}>{children}</div>
        <button
          type="button"
          aria-label="Close message"
          onClick={() => setGone(true)}
          style={{
            flex: "0 0 auto",
            width: 28,
            height: 28,
            border: "none",
            borderRadius: 8,
            background: "transparent",
            color: c[2],
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>
    </div>,
    document.body,
  );
}
