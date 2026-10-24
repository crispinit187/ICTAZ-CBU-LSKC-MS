import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { can, useAuth } from "../../auth/AuthProvider.jsx";
import { demoOpen } from "../../lib/supabase.js";
import { live, rpc } from "../../lib/api.js";
import ConfirmDialog from "../ConfirmDialog.jsx";
import { AccountMenu, GROUPS, label } from "./AdminShell.jsx";
import { AdminChrome, PageTransition } from "./adminChrome.js";

/* One small line icon per page, shown on its own when the side panel is collapsed. */
const ICONS = {
  dashboard: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  sessions: "M3 5h18v16H3z M3 10h18 M8 3v4 M16 3v4",
  members:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8",
  approvals: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M8 12l3 3 5-6",
  executives: "M3 7h18v13H3z M9 7V4h6v3 M3 13h18",
  roles: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  programs: "M4 4h16v14H6a2 2 0 0 0-2 2z M8 8h8",
  analytics: "M4 20V10 M10 20V4 M16 20v-7 M22 20H2",
  reports: "M12 3v12 M7 11l5 5 5-5 M4 20h16",
  audit: "M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",
  settings:
    "M4 6h10 M18 6h2 M4 12h4 M12 12h8 M4 18h12 M14 4v4 M8 10v4 M16 16v4",
  registrar: "M9 4h6v3H9z M7 5H5v16h14V5h-2 M9 14l2 2 4-4",
  display: "M3 4h18v12H3z M8 20h8 M12 16v4",
};
function Icon({ name }) {
  return (
    <svg
      className="nav-icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name] || ICONS.dashboard} />
    </svg>
  );
}

const PREF = "adm_side_collapsed";
const readCollapsed = () => {
  try {
    return window.localStorage.getItem(PREF) === "1";
  } catch (e) {
    return false;
  }
};

/* The page the menu should mark: the exact address, or a page inside it. */
function activeKeyFor(path) {
  let best = "";
  let key = "";
  GROUPS.forEach((g) =>
    g.items.forEach((it) => {
      const hit =
        path === it.to || (it.to !== "/admin" && path.startsWith(it.to + "/"));
      if (hit && it.to.length > best.length) {
        best = it.to;
        key = it.key;
      }
    }),
  );
  return key;
}

const badgeStyle = {
  minWidth: 22,
  padding: "2px 7px",
  boxSizing: "border-box",
  textAlign: "center",
  borderRadius: 20,
  background: "#0066ff",
  color: "#fff",
  fontSize: 12,
  fontWeight: "bold",
};

function Sidebar({ active, pending, accountTop, collapsed, onToggle }) {
  const auth = useAuth();
  const nav = useNavigate();
  const [count, setCount] = useState(null);
  const canApprove =
    can(auth.ctx, "account.approve") || can(auth.ctx, "registration.view");
  useEffect(() => {
    if (pending !== undefined || !live() || !canApprove) return undefined;
    let on = true;
    rpc("pending_count").then((r) => on && !r.error && setCount(r.data));
    return () => {
      on = false;
    };
  }, [pending, canApprove, active]);
  const badge = pending !== undefined ? pending : count;
  // Super Admins see how many deletion requests are waiting on the Members item
  const [delCount, setDelCount] = useState(0);
  const canDelete = can(auth.ctx, "member.delete");
  useEffect(() => {
    if (!live() || !canDelete) return undefined;
    let on = true;
    rpc("list_deletion_requests").then(
      (r) => on && !r.error && setDelCount((r.data || []).length),
    );
    return () => {
      on = false;
    };
  }, [canDelete, active]);

  const [menu, setMenu] = useState(false);
  const { livePath } = useContext(PageTransition);
  // the phone menu folds away after choosing a page, and with Escape
  useEffect(() => setMenu(false), [livePath]);
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
  const name = ctx ? ctx.name : "Sample Administrator";
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "?";

  // scrollbar of the menu: shows while scrolling or hovering, fades out after 5 seconds
  const [bar, setBar] = useState(false);
  const barTimer = useRef(null);
  const poke = useCallback(() => {
    setBar(true);
    clearTimeout(barTimer.current);
    barTimer.current = setTimeout(() => setBar(false), 5000);
  }, []);
  useEffect(() => () => clearTimeout(barTimer.current), []);

  // the blue highlight: one shape that glides to the page being opened
  const navRef = useRef(null);
  const itemRefs = useRef({});
  const [ind, setInd] = useState({ y: 0, h: 0, on: false });
  const [anim, setAnim] = useState(false);
  const measure = useCallback(() => {
    const el = itemRefs.current[active];
    if (!el || !active) return setInd((p) => (p.on ? { ...p, on: false } : p));
    setInd((p) =>
      p.on && p.y === el.offsetTop && p.h === el.offsetHeight
        ? p
        : { y: el.offsetTop, h: el.offsetHeight, on: true },
    );
  }, [active]);
  useLayoutEffect(measure, [measure, collapsed, ctx, badge, delCount]);
  useEffect(() => {
    if (!navRef.current || typeof ResizeObserver === "undefined")
      return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(navRef.current);
    return () => ro.disconnect();
  }, [measure]);
  // switch the glide on only after the first position is set, so it never slides in from the top
  useEffect(() => {
    if (!ind.on || anim) return undefined;
    const f = requestAnimationFrame(() => setAnim(true));
    return () => cancelAnimationFrame(f);
  }, [ind.on, anim]);

  const signOut = () =>
    setAsk({
      title: "Sign out?",
      body: "You will need to sign in again to continue.",
      confirmLabel: "Sign out",
      tone: "info",
      run: async () => {
        if (await auth.leave()) return;
        nav("/login", { replace: true });
      },
    });

  const link = (key, to, text, extra) => (
    <Link
      key={key}
      ref={(el) => {
        itemRefs.current[key] = el;
      }}
      className="nav-item"
      to={to}
      title={collapsed ? text : undefined}
      aria-label={collapsed ? text : undefined}
      aria-current={active === key ? "page" : undefined}
    >
      <Icon name={key} />
      <span className="nav-label">{text}</span>
      {extra}
    </Link>
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
        {accountTop && <AccountMenu className="adm-acct-phone" />}
      </div>
      {menu && (
        <div
          className="adm-backdrop"
          aria-hidden="true"
          onClick={() => setMenu(false)}
        ></div>
      )}
      <aside className={"adm-side" + (menu ? " open" : "")}>
        <button
          type="button"
          aria-label="Close menu"
          className="adm-close"
          onClick={() => setMenu(false)}
        >
          ✕
        </button>
        <div className="adm-brand">
          <Link to="/admin" className="adm-logo">
            {"ICTAZ "}
            <span style={{ color: "#0066ff" }}>CBU</span>
          </Link>
          <button
            type="button"
            className="adm-collapse"
            aria-label={
              collapsed ? "Expand the side panel" : "Collapse the side panel"
            }
            aria-expanded={!collapsed}
            title={collapsed ? "Expand" : "Collapse"}
            onClick={onToggle}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{
                transform: collapsed ? "rotate(180deg)" : "none",
                transition: "transform 0.25s ease",
              }}
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        </div>
        <nav
          ref={navRef}
          className={"adm-nav adm-scroll" + (bar ? " show" : "")}
          aria-label="Management pages"
          onScroll={poke}
          onMouseMove={poke}
          onMouseEnter={poke}
        >
          <div
            className={
              "nav-ind" + (ind.on ? " on" : "") + (anim ? " anim" : "")
            }
            style={{ transform: `translateY(${ind.y}px)`, height: ind.h }}
            aria-hidden="true"
          ></div>
          {GROUPS.map((g, gi) => {
            const items = g.items.filter(show);
            if (!items.length) return null;
            return (
              <React.Fragment key={g.title}>
                <div
                  className="nav-group"
                  style={{ ...label, paddingTop: gi > 0 ? 18 : 0 }}
                >
                  <span>{g.title}</span>
                </div>
                {items.map((it) =>
                  link(
                    it.key,
                    it.to,
                    it.label,
                    <>
                      {it.delBadge && delCount > 0 && (
                        <span
                          className="nav-badge"
                          title="Deletion requests waiting"
                          style={badgeStyle}
                        >
                          {delCount}
                        </span>
                      )}
                      {it.badge && badge > 0 && (
                        <span className="nav-badge" style={badgeStyle}>
                          {badge}
                        </span>
                      )}
                    </>,
                  ),
                )}
              </React.Fragment>
            );
          })}
          {(open || can(ctx, "attendance.mark_manual")) && (
            <>
              <div className="nav-group" style={{ ...label, paddingTop: 18 }}>
                <span>REGISTRAR MODE</span>
              </div>
              {link("registrar", "/registrar", "Mark attendance")}
              {(open || can(ctx, "session.qr_display")) &&
                link("display", "/display", "QR display")}
            </>
          )}
        </nav>
        {!accountTop &&
          (collapsed ? (
            <div className="adm-mini">
              <Link
                to="/profile"
                className="adm-initials"
                title={name + " · Profile"}
                aria-label={"Profile of " + name}
              >
                {initials}
              </Link>
              <button
                type="button"
                className="adm-collapse"
                title="Sign out"
                aria-label="Sign out"
                onClick={signOut}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="adm-profile">
              <div style={{ fontSize: 14, fontWeight: "bold" }}>{name}</div>
              <div style={{ marginTop: 3, color: "#8a99b3", fontSize: 12 }}>
                {ctx
                  ? roles.join(", ") || "Member"
                  : "Administrator · Executive"}
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
                  signOut();
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
          ))}
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

/* The frame of every management page: the side panel is drawn once and stays put while the
   pages change inside it. On a computer the panel is pinned and the page scrolls on its own. */
export default function AdminLayout() {
  const auth = useAuth();
  const trans = useContext(PageTransition);
  const [pending, setPending] = useState(undefined);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const content = useRef(null);
  const toggle = () =>
    setCollapsed((c) => {
      try {
        window.localStorage.setItem(PREF, c ? "0" : "1");
      } catch (e) {
        /* the choice just is not remembered */
      }
      return !c;
    });
  useEffect(() => {
    if (content.current) content.current.scrollTop = 0;
  }, [trans.shownPath]);
  const chrome = useMemo(() => ({ setPending }), []);
  const active = activeKeyFor(trans.livePath || "");
  const framed = demoOpen || !auth.configured || (auth.ready && auth.ctx);
  if (!framed) return <Outlet />;
  return (
    <AdminChrome.Provider value={chrome}>
      <div
        className={"scr-admin adm-layout" + (collapsed ? " collapsed" : "")}
        style={{
          background: "#050505",
          color: "#fff",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <Sidebar
          active={active}
          pending={pending}
          accountTop={active === "dashboard"}
          collapsed={collapsed}
          onToggle={toggle}
        />
        <div className="adm-content" ref={content}>
          <div
            key={trans.shownPath}
            className={"adm-page page-" + (trans.contentPhase || "in")}
          >
            <Outlet />
          </div>
        </div>
      </div>
    </AdminChrome.Provider>
  );
}
