import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AuthPage,
  BackLink,
  Banner,
  Card,
  Eyebrow,
} from "../components/auth/AuthParts.jsx";
import { latestTerms } from "../lib/terms.js";

// Sample wording for the design demo. Super Admins publish the real text and each new version (TC-09).
const DOCS = {
  terms: {
    title: "Terms of Use",
    sections: [
      [
        "Who this is for",
        "These terms apply to every person who registers on the ICTAZ CBU LSKC Management System.",
      ],
      [
        "Using the system",
        "Use your own account only. Do not share your password. Do not share the attendance QR code, photograph it for someone else or mark another person present. Registrars and Administrators may correct records, and every correction is logged.",
      ],
      [
        "Accounts",
        "New accounts are approved by an Administrator. An account may be suspended or deactivated if these terms are broken.",
      ],
      [
        "Changes",
        "When these terms change, you will be asked to accept the new version the next time you sign in.",
      ],
    ],
  },
  privacy: {
    title: "Privacy Notice",
    sections: [
      [
        "What we collect",
        "Your name, student number, email, programme, year of study, optional phone number, and your attendance records.",
      ],
      [
        "Why",
        "To run chapter membership and attendance, and to report attendance in aggregate.",
      ],
      [
        "Who can see it",
        "Members and Registrars see limited details. Reviewers and Administrators see full details. Executives appear publicly only if they consent and an Administrator turns display on.",
      ],
      [
        "How long we keep it",
        "Retention periods are set by a Super Admin. Personal details can be anonymised while keeping attendance totals.",
      ],
    ],
  },
};

export default function LegalPage({ kind }) {
  const d = DOCS[kind];
  // The real text comes from the database once it is published; the sample is the fallback.
  const [live, setLive] = useState(null);
  useEffect(() => {
    let alive = true;
    setLive(null);
    latestTerms(kind).then((v) => alive && setLive(v));
    return () => {
      alive = false;
    };
  }, [kind]);
  return (
    <AuthPage width={720}>
      <BackLink label="Back" to="/login" history />
      <Eyebrow>{live ? "VERSION " + live.version : "VERSION 2"}</Eyebrow>
      <h1
        style={{ margin: "10px 0 18px", fontSize: 36, letterSpacing: "-1.4px" }}
      >
        {d.title}
      </h1>
      {!live && (
        <Banner tone="warn">
          Sample wording for the design demo. The real text is written and
          published by a Super Admin.
        </Banner>
      )}
      <Card>
        {live &&
          live.body.split(/\n{2,}/).map((para, i) => (
            <p
              key={i}
              style={{
                margin: "0 0 14px",
                color: "#aebfda",
                fontSize: 15,
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {para}
            </p>
          ))}
        {!live &&
          d.sections.map(([h, t]) => (
            <section key={h} style={{ marginBottom: 20 }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 18 }}>{h}</h2>
              <p
                style={{
                  margin: 0,
                  color: "#aebfda",
                  fontSize: 15,
                  lineHeight: 1.7,
                }}
              >
                {t}
              </p>
            </section>
          ))}
        <Link to={kind === "terms" ? "/privacy" : "/terms"}>
          {kind === "terms"
            ? "Read the Privacy Notice"
            : "Read the Terms of Use"}
        </Link>
      </Card>
    </AuthPage>
  );
}
