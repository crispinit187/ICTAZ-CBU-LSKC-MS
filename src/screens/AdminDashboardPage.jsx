import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminDashboard from "./AdminDashboard.jsx";
import { Splash } from "../auth/guards.jsx";
import { live, rpc } from "../lib/api.js";
import { can, useAuth } from "../auth/AuthProvider.jsx";

/* Loads the dashboard figures and the waiting registrations, then hands them to the screen.
   Without a database it shows the sample dashboard. */
export default function AdminDashboardPage() {
  const nav = useNavigate();
  const auth = useAuth();
  const [data, setData] = useState(null);
  const [pending, setPending] = useState([]);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const [d, p] = await Promise.all([
      rpc("admin_dashboard"),
      rpc("list_pending_registrations", { p_status: "Pending" }),
    ]);
    if (d.error) return setErr(d.error);
    setErr("");
    setData(d.data);
    // a reviewer can see the dashboard but not the approvals list
    setPending(p.error ? [] : p.data || []);
  }, []);

  useEffect(() => {
    if (!live()) return undefined;
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  if (!live()) return <AdminDashboard onNavigate={nav} />;
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
        Could not load the dashboard: {err}
      </div>
    );
  if (!data) return <Splash />;

  const real = {
    data,
    pending,
    can: (code) => can(auth.ctx, code),
    onApprove: async (id) => {
      const r = await rpc("approve_registration", { p_id: id });
      await load();
      return r.error;
    },
    onClose: async (id) => {
      const r = await rpc("close_session", { p_id: id });
      await load();
      return r.error;
    },
    onDecline: async (id, reason) => {
      const r = await rpc("decline_registration", {
        p_id: id,
        p_reason: reason,
      });
      await load();
      return r.error;
    },
  };
  return <AdminDashboard real={real} onNavigate={nav} />;
}
