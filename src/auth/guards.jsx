import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { demoOpen } from "../lib/supabase.js";
import { homeFor, useAuth } from "./AuthProvider.jsx";

export function Splash() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050505",
        color: "#aebfda",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: 14,
      }}
    >
      Loading...
    </div>
  );
}

/* Wraps a signed-in page. `need` is a permission code from the database, such as
   "analytics.view". People without it are sent to their own home page. */
export function Protected({ need, children }) {
  const a = useAuth();
  const loc = useLocation();
  if (demoOpen || !a.configured) return children;
  if (!a.ready) return <Splash />;
  if (!a.ctx || a.ctx.status !== "Active")
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (a.gate) return <Navigate to="/first-sign-in" replace />;
  if (need && !(a.ctx.permissions || []).includes(need))
    return <Navigate to={homeFor(a.ctx)} replace />;
  return children;
}

/* The first sign-in page: only for people who still have something to finish. */
export function GateOnly({ children }) {
  const a = useAuth();
  if (demoOpen || !a.configured) return children;
  if (!a.ready) return <Splash />;
  if (!a.ctx || a.ctx.status !== "Active")
    return <Navigate to="/login" replace />;
  if (!a.gate) return <Navigate to={homeFor(a.ctx)} replace />;
  return children;
}
