import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cropSquare, readImage } from "../lib/picture.js";

const V = 260; // size of the circle on screen

/* Lets the person move and zoom a picture inside the circle before saving.
   onSave(blob) receives the square cut; onCancel() closes without saving. */
export default function PictureAdjust({ file, onSave, onCancel }) {
  const [src, setSrc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [bad, setBad] = useState(false);
  const im = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    let url = null;
    let dead = false;
    readImage(file)
      .then((r) => {
        if (dead) return URL.revokeObjectURL(r.url);
        url = r.url;
        im.current = r.img;
        const s0 = Math.max(V / r.img.width, V / r.img.height);
        setPos({
          x: (V - r.img.width * s0) / 2,
          y: (V - r.img.height * s0) / 2,
        });
        setSrc(r.url);
      })
      .catch(() => !dead && setBad(true));
    return () => {
      dead = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);

  useEffect(() => {
    const k = (e) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onCancel]);

  const img = im.current;
  const s0 = img ? Math.max(V / img.width, V / img.height) : 1;
  const scale = s0 * zoom;
  const clamp = (p, sc) => ({
    x: Math.min(0, Math.max(V - img.width * sc, p.x)),
    y: Math.min(0, Math.max(V - img.height * sc, p.y)),
  });

  const onZoom = (z) => {
    const ns = s0 * z;
    // keep the centre of the circle where it is
    const cx = (V / 2 - pos.x) / scale;
    const cy = (V / 2 - pos.y) / scale;
    setZoom(z);
    setPos(clamp({ x: V / 2 - cx * ns, y: V / 2 - cy * ns }, ns));
  };

  const down = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, p: pos };
  };
  const move = (e) => {
    const d = drag.current;
    if (!d || !img) return;
    setPos(
      clamp({ x: d.p.x + e.clientX - d.x, y: d.p.y + e.clientY - d.y }, scale),
    );
  };
  const up = () => (drag.current = null);

  const save = async () => {
    if (!img) return;
    setBusy(true);
    try {
      const blob = await cropSquare(
        img,
        -pos.x / scale,
        -pos.y / scale,
        V / scale,
      );
      onSave(blob);
    } catch (e) {
      setBad(true);
      setBusy(false);
    }
  };

  return createPortal(
    <div
      className="cd-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pa-title"
        className="cd-card"
        style={{ textAlign: "center" }}
      >
        <h2 id="pa-title" style={{ margin: 0, fontSize: 20 }}>
          Adjust your picture
        </h2>
        <p style={{ margin: "8px 0 14px", color: "#aebfda", fontSize: 14 }}>
          Drag to move it and use the slider to zoom. What is inside the circle
          is what people see. The full picture is kept.
        </p>
        {bad ? (
          <div role="alert" style={{ color: "#ffb3b3", margin: "20px 0" }}>
            That file could not be read as a picture.
          </div>
        ) : (
          <div
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            style={{
              width: V,
              height: V,
              margin: "0 auto",
              borderRadius: "50%",
              overflow: "hidden",
              position: "relative",
              touchAction: "none",
              cursor: "grab",
              background: "#111",
              border: "2px solid rgba(84,173,255,0.6)",
            }}
          >
            {src && img && (
              <img
                src={src}
                alt="Picture being adjusted"
                draggable={false}
                style={{
                  position: "absolute",
                  left: pos.x,
                  top: pos.y,
                  width: img.width * scale,
                  height: img.height * scale,
                  maxWidth: "none",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
        )}
        {!bad && (
          <label
            style={{
              display: "block",
              marginTop: 16,
              fontSize: 13,
              color: "#aebfda",
            }}
          >
            Zoom
            <input
              type="range"
              min="1"
              max="3"
              step="0.02"
              value={zoom}
              disabled={!img}
              onChange={(e) => onZoom(Number(e.target.value))}
              style={{ width: "100%", marginTop: 6 }}
            />
          </label>
        )}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            marginTop: 18,
          }}
        >
          <button
            type="button"
            className="btn-ghost"
            onClick={onCancel}
            style={{
              padding: "11px 18px",
              border: "1px solid #333",
              borderRadius: 8,
              background: "transparent",
              color: "#fff",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          {!bad && (
            <button
              type="button"
              onClick={save}
              disabled={!img || busy}
              style={{
                padding: "11px 18px",
                border: "none",
                borderRadius: 8,
                background: "#0066ff",
                color: "#fff",
                fontFamily: "inherit",
                fontSize: 14,
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {busy ? "Saving..." : "Save picture"}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
