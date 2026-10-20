import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* Confirmation for critical actions (SRS section 7.12).
   cfg: { title, body, confirmLabel, tone: "danger"|"warning"|"info",
          warning?, reasonLabel?, minReason?, typeToConfirm? }
   Cancel is focused first, Escape and the backdrop cancel, Tab stays inside. */
const TONES = {
  danger: {
    line: "rgba(255,107,107,0.5)",
    btn: "#ff6b6b",
    btnText: "#1a0505",
    chip: "#ffb3b3",
  },
  warning: {
    line: "rgba(255,176,32,0.5)",
    btn: "#ffb020",
    btnText: "#1f1400",
    chip: "#ffd98a",
  },
  info: {
    line: "rgba(84,173,255,0.5)",
    btn: "#0066ff",
    btnText: "#ffffff",
    chip: "#bcd6ff",
  },
};

export function UnsavedGuard({ active }) {
  useEffect(() => {
    if (!active) return undefined;
    const h = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [active]);
  return null;
}

export default function ConfirmDialog({ cfg, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");
  const box = useRef(null);
  const cancelRef = useRef(null);
  const tone = TONES[cfg.tone] || TONES.danger;
  const minReason = cfg.reasonLabel ? cfg.minReason || 3 : 0;
  const ok =
    reason.trim().length >= minReason &&
    (!cfg.typeToConfirm || typed.trim() === cfg.typeToConfirm);

  useEffect(() => {
    const prev = document.activeElement;
    if (cancelRef.current) cancelRef.current.focus();
    return () => {
      if (prev && prev.focus) prev.focus();
    };
  }, []);

  const onKey = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onCancel();
      return;
    }
    if (e.key !== "Tab" || !box.current) return;
    const f = box.current.querySelectorAll(
      "button:not([disabled]), input, textarea",
    );
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const field = {
    width: "100%",
    boxSizing: "border-box",
    marginTop: 6,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #333333",
    background: "#0d0d0d",
    color: "#ffffff",
    fontFamily: "inherit",
    fontSize: 14,
  };

  return createPortal(
    <div
      className="cd-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      onKeyDown={onKey}
    >
      <div
        ref={box}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cd-title"
        aria-describedby="cd-body"
        className="cd-card"
        style={{ borderColor: tone.line }}
      >
        <h2
          id="cd-title"
          style={{ margin: 0, fontSize: 20, letterSpacing: "-0.4px" }}
        >
          {cfg.title}
        </h2>
        <p
          id="cd-body"
          style={{
            margin: "10px 0 0",
            color: "#aebfda",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {cfg.body}
        </p>
        {cfg.warning && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(255,176,32,0.1)",
              border: "1px solid rgba(255,176,32,0.4)",
              color: "#ffd98a",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {cfg.warning}
          </div>
        )}
        {cfg.reasonLabel && (
          <label
            style={{
              display: "block",
              marginTop: 16,
              fontSize: 13,
              fontWeight: "bold",
            }}
          >
            {cfg.reasonLabel}
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ ...field, resize: "vertical" }}
            />
          </label>
        )}
        {cfg.typeToConfirm && (
          <label
            style={{
              display: "block",
              marginTop: 16,
              fontSize: 13,
              fontWeight: "bold",
            }}
          >
            Type <span style={{ color: tone.chip }}>{cfg.typeToConfirm}</span>{" "}
            to confirm
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              style={field}
            />
          </label>
        )}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 22,
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <button
            ref={cancelRef}
            type="button"
            className="cd-cancel"
            onClick={onCancel}
            style={{
              padding: "11px 18px",
              borderRadius: 8,
              border: "1px solid #333333",
              background: "transparent",
              color: "#ffffff",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {cfg.cancelLabel || "Cancel"}
          </button>
          <button
            type="button"
            disabled={!ok}
            onClick={() => ok && onConfirm(reason.trim())}
            style={{
              padding: "11px 18px",
              borderRadius: 8,
              border: "none",
              background: tone.btn,
              color: tone.btnText,
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: "bold",
              cursor: ok ? "pointer" : "not-allowed",
              opacity: ok ? 1 : 0.4,
            }}
          >
            {cfg.confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
