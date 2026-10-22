import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { pictureUrl, thumbUrl } from "../lib/picture.js";

/* A round picture. Clicking it opens the full picture. Older pictures that
   have no circle version fall back to the full one. */
export default function PictureCircle({ path, size, name, border }) {
  const [open, setOpen] = useState(false);
  const [plain, setPlain] = useState(false);
  const full = pictureUrl(path);
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open]);
  if (!full) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={"View the full picture" + (name ? " of " + name : "")}
        style={{
          padding: 0,
          border: border || "none",
          background: "none",
          borderRadius: "50%",
          width: size,
          height: size,
          flex: "0 0 " + size + "px",
          cursor: "zoom-in",
          overflow: "hidden",
        }}
      >
        <img
          src={plain ? full : thumbUrl(path)}
          onError={() => setPlain(true)}
          alt={name || ""}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </button>
      {open &&
        createPortal(
          <div
            className="cd-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Full picture"
            onClick={() => setOpen(false)}
            style={{ cursor: "zoom-out" }}
          >
            <img
              src={full}
              alt={name || "Full picture"}
              style={{
                maxWidth: "92vw",
                maxHeight: "86vh",
                borderRadius: 12,
                objectFit: "contain",
              }}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
