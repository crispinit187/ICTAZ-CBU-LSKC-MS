import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import RegistrarMarking from "./RegistrarMarking.jsx";
import { Splash } from "../auth/guards.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import { live, rpc } from "../lib/api.js";
import { whenText } from "../lib/format.js";

/* Loads the sessions a Registrar can mark, searches members, and records marks through the database. */
export default function RegistrarPage() {
  const auth = useAuth();
  const nav = useNavigate();
  const [sessions, setSessions] = useState(null);
  const [sid, setSid] = useState("");
  const [results, setResults] = useState([]);
  const [liveCounts, setLiveCounts] = useState({ present: 0, excused: 0 });
  const [err, setErr] = useState("");
  const lastQuery = useRef("");
  const timer = useRef(null);

  const loadSessions = useCallback(async () => {
    const r = await rpc("open_sessions_for_marking");
    if (r.error) return setErr(r.error);
    setSessions(r.data || []);
    setSid((cur) =>
      cur && (r.data || []).some((x) => x.id === cur)
        ? cur
        : r.data && r.data[0]
          ? r.data[0].id
          : "",
    );
  }, []);

  useEffect(() => {
    if (!live()) return undefined;
    loadSessions();
    const t = setInterval(loadSessions, 30000);
    return () => clearInterval(t);
  }, [loadSessions]);

  const loadLive = useCallback(async () => {
    if (!sid) return;
    const r = await rpc("session_live", { p_session: sid });
    if (!r.error)
      setLiveCounts({
        present: Number(r.data.present),
        excused: Number(r.data.excused),
      });
  }, [sid]);

  useEffect(() => {
    if (!live() || !sid) return undefined;
    loadLive();
    const t = setInterval(loadLive, 4000);
    return () => clearInterval(t);
  }, [sid, loadLive]);

  const search = useCallback(
    async (q) => {
      lastQuery.current = q;
      if (!sid || q.trim().length < 2) return setResults([]);
      const r = await rpc("roster_search", { p_session: sid, p_query: q });
      if (q === lastQuery.current) setResults(r.error ? [] : r.data || []);
    },
    [sid],
  );

  const onSearch = (q) => {
    lastQuery.current = q;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(q), 250);
  };

  const after = async (r) => {
    await Promise.all([search(lastQuery.current), loadLive()]);
    return r.error;
  };

  if (!live()) return <RegistrarMarking onNavigate={nav} />;
  if (err)
    return (
      <div
        role="alert"
        style={{
          padding: 32,
          color: "#ffb3b3",
          background: "#050505",
          minHeight: "100vh",
          fontFamily: "Arial",
        }}
      >
        Could not load: {err}
      </div>
    );
  if (!sessions) return <Splash />;

  const signOut = async () => {
    if (await auth.leave()) return;
    nav("/login", { replace: true });
  };

  if (!sessions.length)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#050505",
          color: "#fff",
          fontFamily: "Arial, Helvetica, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          textAlign: "center",
          padding: 24,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28 }}>
          No session is open for marking
        </h1>
        <p style={{ margin: 0, color: "#aebfda" }}>
          When an Administrator opens a session it appears here. Closed sessions
          stay here for 12 hours.
        </p>
        <div style={{ display: "flex", gap: 14 }}>
          <button
            type="button"
            onClick={() => nav("/scan")}
            style={{
              padding: "10px 16px",
              background: "transparent",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Scan my own attendance
          </button>
          <button
            type="button"
            onClick={signOut}
            style={{
              padding: "10px 16px",
              background: "transparent",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    );

  const session = sessions.find((x) => x.id === sid) || sessions[0];
  const real = {
    userName: auth.ctx ? auth.ctx.name : "",
    sessions,
    session,
    when: whenText(session.start_at, session.end_at, session.venue),
    live: liveCounts,
    results,
    onSession: (id) => {
      setSid(id);
      setResults([]);
    },
    onSearch,
    mark: async (member) =>
      after(
        await rpc("mark_present", { p_session: session.id, p_member: member }),
      ),
    excuse: async (member, reason) =>
      after(
        await rpc("excuse_member", {
          p_session: session.id,
          p_member: member,
          p_reason: reason,
        }),
      ),
    unmark: async (member, reason) =>
      after(
        await rpc("void_attendance", {
          p_session: session.id,
          p_member: member,
          p_reason: reason,
        }),
      ),
  };
  return <RegistrarMarking real={real} onNavigate={nav} onSignOut={signOut} />;
}
