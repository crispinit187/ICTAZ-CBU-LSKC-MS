import React, { useCallback } from "react";
import AdminShell from "../components/admin/AdminShell.jsx";
import AttendanceHistory from "../components/AttendanceHistory.jsx";
import UpcomingSessions from "../components/UpcomingSessions.jsx";
import { can, useAuth } from "../auth/AuthProvider.jsx";
import { rpc } from "../lib/api.js";

/* The member's home: what is coming up and how they have attended. */
export default function MemberHome() {
  const { ctx } = useAuth();
  const load = useCallback(
    (scope) => rpc("my_attendance", { p_scope: scope }),
    [],
  );
  const first = ctx ? String(ctx.name || "").split(" ")[0] : "there";
  return (
    <AdminShell
      title="Sessions"
      subtitle={
        "Hello, " +
        first +
        ". Here is what is coming up and how you have attended."
      }
    >
      <UpcomingSessions canScan={!ctx || can(ctx, "attendance.scan")} />
      <AttendanceHistory load={load} />
    </AdminShell>
  );
}
