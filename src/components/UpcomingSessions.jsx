import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Btn, T, card } from "./admin/ui.jsx";
import { live, rpc } from "../lib/api.js";
import { whenText } from "../lib/format.js";
import { posterUrl } from "../lib/poster.js";

const SAMPLE = [
  {
    id: "s1",
    title: "Introduction to Cloud Computing",
    description:
      "A hands-on evening with the basics of cloud services. Bring your laptop.",
    venue: "Main Hall",
    status: "Scheduled",
    start_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    end_at: new Date(Date.now() + 2 * 86400000 + 5400000).toISOString(),
    facilitators: ["Mary Phiri", "John Banda"],
  },
];

/* "in 3 days", "in 5 hours", "starts soon" */
export function countdown(startIso, endIso, now = Date.now()) {
  const s = new Date(startIso).getTime();
  if (now >= s && now <= new Date(endIso).getTime()) return "Happening now";
  const m = Math.round((s - now) / 60000);
  if (m <= 0) return "Starting now";
  if (m < 60) return "Starts in " + m + " min";
  const h = Math.round(m / 60);
  if (h < 24) return "Starts in " + h + (h === 1 ? " hour" : " hours");
  const d = Math.round(h / 24);
  return "Starts in " + d + (d === 1 ? " day" : " days");
}

function Poster({ path, title, style }) {
  const url = posterUrl(path);
  if (url)
    return (
      <img
        src={url}
        alt={"Poster for " + title}
        loading="lazy"
        style={{
          width: "100%",
          display: "block",
          objectFit: "cover",
          ...style,
        }}
      />
    );
  return (
    <div
      role="img"
      aria-label="No poster"
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at 80% 10%, rgba(0,102,255,0.35), transparent 55%), #0a1220",
        color: "#54adff",
        fontWeight: "bold",
        letterSpacing: "-0.5px",
        fontSize: 22,
        textAlign: "center",
        padding: 16,
        boxSizing: "border-box",
        ...style,
      }}
    >
      {title}
    </div>
  );
}

function Details({ s, canScan, onClose }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const now = s.status === "Open";
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={s.title}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        overflowY: "auto",
        padding: "24px 12px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...card,
          background: "#0b0f17",
          width: "100%",
          maxWidth: 560,
          padding: 0,
          overflow: "hidden",
        }}
      >
        <Poster
          path={s.poster_path}
          title={s.title}
          style={{ minHeight: 160 }}
        />
        <div style={{ padding: 22 }}>
          <div style={{ color: T.light, fontSize: 13, fontWeight: "bold" }}>
            {countdown(s.start_at, s.end_at).toUpperCase()}
          </div>
          <h2 style={{ margin: "6px 0 10px", fontSize: 24 }}>{s.title}</h2>
          <dl style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>
            <dt style={{ color: T.dim }}>When</dt>
            <dd style={{ margin: "0 0 8px" }}>
              {whenText(s.start_at, s.end_at)}
            </dd>
            {s.venue && (
              <>
                <dt style={{ color: T.dim }}>Venue</dt>
                <dd style={{ margin: "0 0 8px" }}>{s.venue}</dd>
              </>
            )}
            {(s.facilitators || []).length > 0 && (
              <>
                <dt style={{ color: T.dim }}>Facilitators</dt>
                <dd style={{ margin: "0 0 8px" }}>
                  {s.facilitators.join(", ")}
                </dd>
              </>
            )}
            {s.description && (
              <>
                <dt style={{ color: T.dim }}>About</dt>
                <dd style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {s.description}
                </dd>
              </>
            )}
          </dl>
          <div
            style={{
              marginTop: 18,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {now && canScan && (
              <Link to="/scan">
                <Btn kind="primary" type="button">
                  Scan attendance
                </Btn>
              </Link>
            )}
            <Btn type="button" onClick={onClose}>
              Close
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* The sessions that are coming up, as cards with their posters. */
export default function UpcomingSessions({ canScan = true }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(null);
  useEffect(() => {
    if (!live()) return setRows(SAMPLE);
    let on = true;
    rpc("upcoming_sessions").then((r) => {
      if (!on) return;
      if (r.error) setErr(r.error);
      else setRows(r.data || []);
    });
    return () => {
      on = false;
    };
  }, []);
  return (
    <section aria-label="Upcoming sessions">
      <h2 style={{ margin: "0 0 12px", fontSize: 20 }}>Upcoming sessions</h2>
      {err && <div style={{ color: T.red, fontSize: 14 }}>{err}</div>}
      {!rows && !err && <div style={{ color: T.dim }}>Loading...</div>}
      {rows && rows.length === 0 && (
        <div style={{ ...card, color: T.muted, fontSize: 14 }}>
          No sessions are scheduled right now. New ones appear here as soon as
          they are created.
        </div>
      )}
      {rows && rows.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          }}
        >
          {rows.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setOpen(s)}
              style={{
                ...card,
                padding: 0,
                overflow: "hidden",
                textAlign: "left",
                cursor: "pointer",
                color: "#fff",
                fontFamily: "inherit",
              }}
            >
              <Poster
                path={s.poster_path}
                title={s.title}
                style={{ height: 150 }}
              />
              <div style={{ padding: 16 }}>
                <div
                  style={{
                    color: s.status === "Open" ? T.green : T.light,
                    fontSize: 12,
                    fontWeight: "bold",
                    letterSpacing: 1,
                  }}
                >
                  {countdown(s.start_at, s.end_at).toUpperCase()}
                </div>
                <div
                  style={{
                    margin: "6px 0 4px",
                    fontSize: 17,
                    fontWeight: "bold",
                  }}
                >
                  {s.title}
                </div>
                <div style={{ color: T.muted, fontSize: 13 }}>
                  {whenText(s.start_at, s.end_at, s.venue)}
                </div>
                {(s.facilitators || []).length > 0 && (
                  <div style={{ marginTop: 6, color: T.dim, fontSize: 13 }}>
                    {s.facilitators.join(", ")}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      {open && (
        <Details s={open} canScan={canScan} onClose={() => setOpen(null)} />
      )}
    </section>
  );
}
