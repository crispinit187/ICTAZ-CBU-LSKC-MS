import React, { useCallback, useEffect, useRef, useState } from "react";
import RoleAssignment from "./RoleAssignment.jsx";
import { Splash } from "../auth/guards.jsx";
import { live, rpc } from "../lib/api.js";

/* Loads the people who hold staff roles or executive positions, and applies role changes. */
export default function RoleAssignmentPage() {
  const [people, setPeople] = useState(null);
  const [err, setErr] = useState("");
  const [roleNames, setRoleNames] = useState(null);
  const q = useRef("");
  const timer = useRef(null);

  const load = useCallback(async () => {
    const r = await rpc("list_role_people", { p_search: q.current });
    if (r.error) setErr(r.error);
    else {
      setErr("");
      setPeople(r.data || []);
    }
  }, []);

  useEffect(() => {
    if (!live()) return;
    load();
    rpc("list_assignable_roles").then((r) => !r.error && setRoleNames(r.data));
  }, [load]);

  if (!live()) return <RoleAssignment />;
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
  if (!people) return <Splash />;

  const after = async (r) => {
    await load();
    return r.error;
  };
  const real = {
    people,
    roleNames: roleNames || [],
    onSearch: (text) => {
      q.current = text;
      clearTimeout(timer.current);
      timer.current = setTimeout(load, 250);
    },
    assignRole: async (id, role, reason) =>
      after(
        await rpc("assign_role", {
          p_member: id,
          p_role: role,
          p_reason: reason,
        }),
      ),
    removeRole: async (id, reason, role) =>
      after(
        await rpc("remove_role", {
          p_member: id,
          p_reason: reason,
          p_role: role || null,
        }),
      ),
    endProfile: async (profileId, reason) =>
      after(
        await rpc("end_executive", { p_profile: profileId, p_reason: reason }),
      ),
  };
  return <RoleAssignment real={real} />;
}
