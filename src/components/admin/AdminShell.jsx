import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { can, useAuth } from "../../auth/AuthProvider.jsx";
import { demoOpen } from "../../lib/supabase.js";
import { live, rpc } from "../../lib/api.js";
import ConfirmDialog from "../ConfirmDialog.jsx";

/* One sidebar for every management page. An item shows only when the person holds one of the
   permission codes listed, and only when its page exists in this build. */
const GROUPS = [
  {
    title: "MANAGE",
    items: [
      {
        key: "dashboard",
        label: "Dashboard",
        to: "/admin",
        any: ["analytics.view"],
      },
      {
        key: "sessions",
        label: "Sessions",
        to: "/admin/sessions",
        any: ["session.create"],
      },
      {
        key: "members",
        label: "Members",
        to: "/admin/members",
        any: ["member.view"],
      },
      {
        key: "approvals",
        label: "Approvals",
        to: "/admin/approvals",
        any: ["account.approve"],
        badge: true,
      },
      {
        key: "executives",
        label: "Executives",
        to: "/admin/executives",
        any: ["executive.view_full"],
      },
      { key: "roles", label: "Roles", to: "/roles", any: ["role.assign"] },
      {
        key: "programs",
        label: "Programs",
        to: "/admin/programs",
        any: ["program.manage"],
      },
    ],
  },
  {
    title: "INSIGHTS",
    items: [
      {
        key: "analytics",
        label: "Analytics",
        to: "/admin/analytics",
        any: ["analytics.view"],
      },
      {
        key: "reports",
        label: "Reports and exports",
        to: "/admin/reports",
        any: ["analytics.export"],
      },
      {
        key: "audit",
        label: "Audit log",
        to: "/admin/audit",
        any: ["audit.view"],
      },
      {
        key: "settings",
        label: "Settings",
        to: "/admin/settings",
        any: ["settings.manage"],
      },
    ],
  },
];

export const isBuilt = (key) =>
  GROUPS.some((g) => g.items.some((i) => i.key === key && i.built !== false));

const label = {
  padding: "0 14px 8px",
  color: "#75859e",
  fontSize: 11,
  fontWeight: "bold",
  letterSpacing: 2,
};

export function AdminSidebar({ active, pending }) {
  const auth = useAuth();
  const [count, setCount] = useState(null);
  const canApprove = can(auth.ctx, "account.approve");
  useEffect(() => {
    if (pending !== undefined || !live() || !canApprove) return undefined;
    let on = true;
    rpc("pending_count").then((r) => on && !r.error && setCount(r.data));
    return () => {
      on = false;
    };
  }, [pending, canApprove]);
  const badge = pending !== undefined ? pending : count;
  const nav = useNavigate();
  const loc = useLocation();
  const [menu, setMenu] = useState(false);
  // the menu folds away after choosing a page, and with Escape
  useEffect(() => setMenu(false), [loc.pathname]);
  useEffect(() => {
    if (!menu) return undefined;
    const k = (e) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [menu]);
  const [ask, setAsk] = useState(null);
  const open = demoOpen || !auth.configured;
  const ctx = auth.ctx;
  const show = (it) =>
    it.built !== false && (open || it.any.some((c) => can(ctx, c)));
  const roles = (ctx && ctx.roles ? ctx.roles : []).filter(
    (r) => r !== "Member",
  );
  return (
    <>
      <div className="adm-topbar">
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={menu}
          onClick={() => setMenu(true)}
          className="adm-burger"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <span
          style={{ fontSize: 18, fontWeight: "bold", letterSpacing: "-0.5px" }}
        >
          {"ICTAZ "}
          <span style={{ color: "#0066ff" }}>CBU</span>
        </span>
      </div>
      {menu && (
        <div
          className="adm-backdrop"
          aria-hidden="true"
          onClick={() => setMenu(false)}
        ></div>
      )}
      <aside
        className={"adm-side" + (menu ? " open" : "")}
        style={{
          flex: "0 0 248px",
          boxSizing: "border-box",
          padding: "22px 16px",
          background: "#000",
          borderRight: "1px solid #1c1c1c",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <button
          type="button"
          aria-label="Close menu"
          className="adm-close"
          onClick={() => setMenu(false)}
        >
          ✕
        </button>
        <Link
          to="/admin"
          style={{
            padding: "4px 14px 22px",
            fontSize: 21,
            fontWeight: "bold",
            letterSpacing: "-0.5px",
            color: "#fff",
          }}
        >
          {"ICTAZ "}
          <span style={{ color: "#0066ff" }}>CBU</span>
        </Link>
        {GROUPS.map((g, gi) => {
          const items = g.items.filter(show);
          if (!items.length) return null;
          return (
            <React.Fragment key={g.title}>
              <div style={{ ...label, paddingTop: gi ? 18 : 0 }}>{g.title}</div>
              {items.map((it) => (
                <Link
                  key={it.key}
                  className="nav-item"
                  to={it.to}
                  aria-current={active === it.key ? "page" : undefined}
                  style={
                    active === it.key
                      ? { background: "rgba(0,102,255,0.14)", color: "#54adff" }
                      : undefined
                  }
                >
                  <span>{it.label}</span>
                  {it.badge && badge > 0 && (
                    <span
                      style={{
                        minWidth: 22,
                        padding: "2px 7px",
                        boxSizing: "border-box",
                        textAlign: "center",
                        borderRadius: 20,
                        background: "#0066ff",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              ))}
            </React.Fragment>
          );
        })}
        <div style={{ flexGrow: 1 }}></div>
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            background: "rgba(255,255,255,0.035)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: "bold" }}>
            {ctx ? ctx.name : "Sample Administrator"}
          </div>
          <div style={{ marginTop: 3, color: "#8a99b3", fontSize: 12 }}>
            {ctx ? roles.join(", ") || "Member" : "Administrator · Executive"}
          </div>
          <Link
            to="/profile"
            style={{
              display: "inline-block",
              marginTop: 10,
              marginRight: 14,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Profile
          </Link>
          <a
            href="#signout"
            onClick={(e) => {
              e.preventDefault();
              setAsk({
                title: "Sign out?",
                body: "You will need to sign in again to continue.",
                confirmLabel: "Sign out",
                tone: "info",
                run: async () => {
                  await auth.signOut();
                  nav("/login");
                },
              });
            }}
            style={{
              display: "inline-block",
              marginTop: 10,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Sign out
          </a>
        </div>
        {ask && (
          <ConfirmDialog
            cfg={ask}
            onCancel={() => setAsk(null)}
            onConfirm={() => {
              const run = ask.run;
              setAsk(null);
              run();
            }}
          />
        )}
      </aside>
    </>
  );
}

/* Page frame used by the management pages: sidebar on the left, title and content on the right. */
export default function AdminShell({
  active,
  pending,
  title,
  subtitle,
  actions,
  children,
}) {
  return (
    <div
      className="scr-admin"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexWrap: "wrap",
        background: "#050505",
        color: "#fff",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <AdminSidebar active={active} pending={pending} />
      <main
        style={{
          flex: "1 1 680px",
          minWidth: 0,
          boxSizing: "border-box",
          padding: "28px 32px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 30, letterSpacing: "-1px" }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ margin: "6px 0 0", color: "#aebfda", fontSize: 14 }}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {actions}
            </div>
          )}
        </header>
        {children}
      </main>
    </div>
  );
}
