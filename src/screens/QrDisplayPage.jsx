import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { can, useAuth } from "../auth/AuthProvider.jsx";
import BackButton from "../components/BackButton.jsx";
import QrDisplay from "./QrDisplay.jsx";
import { live, rpc } from "../lib/api.js";
import { whenText } from "../lib/format.js";

/* Goes back to the dashboard, or to Mark attendance for a Registrar who has no dashboard. */
export function BackHome() {
  const nav = useNavigate();
  const { ctx } = useAuth();
  const dash = !ctx || can(ctx, "analytics.view");
  if (!dash && !can(ctx, "attendance.mark_manual")) return null;
  return (
    <BackButton onClick={() => nav(dash ? "/admin" : "/registrar")}>
      {dash ? "Back to dashboard" : "Back to Mark attendance"}
    </BackButton>
  );
}

function Message({ children }) {
  return (
    <div
      role="status"
      style={{
        width: 1440,
        height: 810,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        background: "#050505",
        color: "#fff",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: 26,
      }}
    >
      {children}
    </div>
  );
}

/* Shows the rotating attendance code for one open session. The server makes every code; this page
   only draws it and asks for the next one when the time is up. */
export default function QrDisplayPage({ demoSeconds }) {
  const [params] = useSearchParams();
  const [sid, setSid] = useState(params.get("session") || "");
  const [state, setState] = useState("loading"); // loading | none | closed | ok
  const [info, setInfo] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [dropped, setDropped] = useState(false);
  const deadline = useRef(0);
  const busy = useRef(false);

  // no session in the link: use the newest open one
  useEffect(() => {
    if (!live() || sid) return;
    rpc("list_sessions", { p_status: "Open", p_limit: 1 }).then((r) => {
      const row = !r.error && r.data && r.data.rows[0];
      if (row) setSid(row.id);
      else setState("none");
    });
  }, [sid]);

  const fetchToken = useCallback(async () => {
    if (!sid || busy.current) return;
    busy.current = true;
    const r = await rpc("session_qr_token", { p_session: sid });
    busy.current = false;
    if (r.error) {
      if (/not open/i.test(r.error)) setState("closed");
      else setDropped(true);
      return;
    }
    setDropped(false);
    setState("ok");
    setInfo(r.data);
    deadline.current = Date.now() + r.data.seconds_left * 1000;
    setRemaining(r.data.seconds_left);
  }, [sid]);

  useEffect(() => {
    if (!live() || !sid) return undefined;
    fetchToken();
    let n = 0;
    const t = setInterval(() => {
      n += 1;
      const left = Math.max(
        0,
        Math.ceil((deadline.current - Date.now()) / 1000),
      );
      setRemaining(left);
      if (left <= 0 || n % 3 === 0) fetchToken();
    }, 1000);
    return () => clearInterval(t);
  }, [sid, fetchToken]);

  if (!live()) return <QrDisplay demoSeconds={demoSeconds} />;
  if (state === "none")
    return (
      <Message>
        <div>No session is open right now.</div>
      </Message>
    );
  if (state === "closed")
    return (
      <Message>
        <div>This session is no longer open.</div>
      </Message>
    );
  if (state === "loading" || !info) return <Message>Loading...</Message>;

  const real = {
    token: info.token,
    period: info.rotation_seconds,
    remaining,
    present: Number(info.present),
    title: info.title,
    when: whenText(info.start_at, info.end_at, info.venue),
    dropped,
  };
  return <QrDisplay real={real} />;
}
