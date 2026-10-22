import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { live, rpc } from "../lib/api.js";
import { pictureUrl } from "../lib/picture.js";

const SAMPLE = [
  { name: "Sample President", title: "President", picture: null },
  { name: "Sample Secretary", title: "Secretary General", picture: null },
];

/* The public page: signed-out visitors can open it. It lists only executives who agreed to appear
   and whom an Administrator switched on, with their name and position. */
export default function PublicExecutives() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!live()) {
      setRows(SAMPLE);
      return;
    }
    rpc("public_executives").then((r) => {
      if (r.error)
        setErr("The executive list could not be loaded. Try again later.");
      else setRows(r.data || []);
    });
  }, []);
  const groups = [];
  (rows || []).forEach((r) => {
    let g = groups.find((x) => x.position === r.title);
    if (!g) groups.push((g = { position: r.title, names: [] }));
    g.names.push({ name: r.name, picture: r.picture });
  });
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "#fff",
        fontFamily: "Arial, Helvetica, sans-serif",
        padding: "56px 20px",
        boxSizing: "border-box",
      }}
    >
      <main style={{ maxWidth: 760, margin: "0 auto" }}>
        <Link
          to="/login"
          style={{
            display: "inline-block",
            marginBottom: 28,
            fontWeight: "bold",
            fontSize: 14,
            color: "#54adff",
            textDecoration: "none",
          }}
        >
          Back to sign in
        </Link>
        <div
          style={{
            color: "#54adff",
            fontSize: 12,
            fontWeight: "bold",
            letterSpacing: 2,
          }}
        >
          ICTAZ CBU LSKC CHAPTER
        </div>
        <h1
          style={{
            margin: "10px 0 8px",
            fontSize: 40,
            letterSpacing: "-1.5px",
          }}
        >
          Our executive
        </h1>
        <p
          style={{
            margin: "0 0 32px",
            color: "#aebfda",
            fontSize: 16,
            lineHeight: 1.6,
          }}
        >
          The members leading the chapter this year.
        </p>
        {err && (
          <p role="alert" style={{ color: "#ffb3b3" }}>
            {err}
          </p>
        )}
        {rows && !rows.length && !err && (
          <p style={{ color: "#8a99b3" }}>
            The executive list will appear here soon.
          </p>
        )}
        {!live() && (
          <p style={{ color: "#ffd98a", fontSize: 13 }}>
            Sample names for the design demo.
          </p>
        )}
        <div style={{ display: "grid", gap: 14 }}>
          {groups.map((g) => (
            <section
              key={g.position}
              style={{
                padding: "20px 24px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h2
                style={{
                  margin: "0 0 10px",
                  fontSize: 13,
                  letterSpacing: 1.5,
                  color: "#54adff",
                }}
              >
                {g.position.toUpperCase()}
              </h2>
              {g.names.map((n) => (
                <div
                  key={n.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "8px 0",
                  }}
                >
                  {n.picture && pictureUrl(n.picture) ? (
                    <img
                      src={pictureUrl(n.picture)}
                      alt={n.name}
                      style={{
                        width: 64,
                        height: 64,
                        flex: "0 0 64px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid rgba(84,173,255,0.5)",
                      }}
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      style={{
                        width: 64,
                        height: 64,
                        flex: "0 0 64px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg,#0066ff,#003d99)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                        fontWeight: "bold",
                      }}
                    >
                      {n.name
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((x) => x[0].toUpperCase())
                        .join("")}
                    </span>
                  )}
                  <div style={{ fontSize: 20, fontWeight: "bold" }}>
                    {n.name}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
