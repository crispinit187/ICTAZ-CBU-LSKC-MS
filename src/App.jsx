import React, { useEffect, useRef, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { gateOf, homeFor, useAuth } from "./auth/AuthProvider.jsx";
import { GateOnly, Protected } from "./auth/guards.jsx";
import { demoOpen } from "./lib/supabase.js";
import { live, rpc } from "./lib/api.js";
import AdminLayout from "./components/admin/AdminLayout.jsx";
import { PageTransition } from "./components/admin/adminChrome.js";
import LoginScreen from "./screens/LoginScreen.jsx";
import AdminDashboardPage from "./screens/AdminDashboardPage.jsx";
import ApprovalsPage from "./screens/ApprovalsPage.jsx";
import MembersPage from "./screens/MembersPage.jsx";
import SessionsPage from "./screens/SessionsPage.jsx";
import ExecutivesPage from "./screens/ExecutivesPage.jsx";
import ProgramsPage from "./screens/ProgramsPage.jsx";
import AnalyticsPage from "./screens/AnalyticsPage.jsx";
import ReportsPage from "./screens/ReportsPage.jsx";
import AuditPage from "./screens/AuditPage.jsx";
import SettingsPage from "./screens/SettingsPage.jsx";
import RegistrarPage from "./screens/RegistrarPage.jsx";
import QrDisplayPage, { BackHome } from "./screens/QrDisplayPage.jsx";
import MemberScan from "./screens/MemberScan.jsx";
import RoleAssignmentPage from "./screens/RoleAssignmentPage.jsx";
import RegisterScreen from "./screens/RegisterScreen.jsx";
import FirstSignIn from "./screens/FirstSignIn.jsx";
import ExecutiveProfile from "./screens/ExecutiveProfile.jsx";
import ForgotPassword from "./screens/ForgotPassword.jsx";
import ResetPassword from "./screens/ResetPassword.jsx";
import PublicExecutives from "./screens/PublicExecutives.jsx";
import LegalPage from "./screens/LegalPage.jsx";
import FitStage from "./components/FitStage.jsx";
import PhoneFrame from "./components/PhoneFrame.jsx";

function useMedia(query) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/* The design's demo tweaks are available as URL options while the backend is mocked:
   /login?demo=wrong|delay|pending|suspended|success
   /scan?demo=success|already|expired|closed
   /display?seconds=12   (the real rotation is 45 seconds)
   /first-sign-in?mode=temp|bootstrap|terms&staff=1
   /reset-password?state=valid|expired */

function Login() {
  const [params] = useSearchParams();
  const compact = useMedia("(max-width: 600px)");
  const nav = useNavigate();
  const auth = useAuth();
  // Real sign-in is used when Supabase is configured. ?demo= or VITE_DEMO_OPEN keeps the demo outcomes.
  const real = auth.configured && !demoOpen && !params.get("demo");
  // Opening the confirmation email brings the person here with type=signup in the address.
  // Remember it before Supabase clears the address.
  const [confirmed] = useState(() =>
    /type=signup|type=email|confirmed=1/.test(
      window.location.hash + window.location.search,
    ),
  );
  const notice =
    params.get("notice") === "google"
      ? "That Google account is not linked to an approved account. You can register, or sign in with your password."
      : null;
  // After the Google round trip the page reloads here with a session. Go on if the account is
  // approved; otherwise sign out and say so (Google never creates accounts).
  useEffect(() => {
    let flag = false;
    try {
      flag = sessionStorage.getItem("lskc_google") === "1";
    } catch (err) {
      flag = false;
    }
    if (!real || !flag || !auth.ready || !auth.session) return;
    try {
      sessionStorage.removeItem("lskc_google");
    } catch (err) {
      /* ignore */
    }
    if (auth.ctx && auth.ctx.status === "Active") {
      nav(gateOf(auth.ctx) ? "/first-sign-in" : homeFor(auth.ctx), {
        replace: true,
      });
    } else {
      auth.signOut().then(() => nav("/login?notice=google", { replace: true }));
    }
  }, [real, auth.ready, auth.session, auth.ctx]); // eslint-disable-line react-hooks/exhaustive-deps
  const onGoogle = () => {
    try {
      sessionStorage.setItem("lskc_google", "1");
    } catch (err) {
      /* ignore */
    }
    return auth.signInWithGoogle();
  };
  const onSignIn = async (id, pw) => {
    const r = await auth.signIn(id, pw);
    if (r.ok)
      nav(gateOf(r.ctx) ? "/first-sign-in" : homeFor(r.ctx), { replace: true });
    return r;
  };
  return (
    <LoginScreen
      demoState={params.get("demo") || "wrong"}
      compact={compact}
      notice={notice}
      confirmed={confirmed}
      onSignIn={real ? onSignIn : undefined}
      onGoogle={real ? onGoogle : undefined}
      onRegister={() => nav("/register")}
      onForgot={(id) =>
        nav("/forgot-password" + (id ? "?id=" + encodeURIComponent(id) : ""))
      }
      onExecutives={() => nav("/executives")}
      onTerms={() => nav("/terms")}
      onPrivacy={() => nav("/privacy")}
    />
  );
}

function Scan() {
  const [params] = useSearchParams();
  const auth = useAuth();
  const nav = useNavigate();
  const real =
    live() && auth.ctx
      ? {
          firstName: String(auth.ctx.name || "").split(" ")[0] || "there",
          onScan: async (text) => {
            const r = await rpc("scan_attendance", { p_token: text });
            return r.error ? { result: "error" } : r.data;
          },
        }
      : undefined;
  return (
    <PhoneFrame>
      <Routed
        as={MemberScan}
        demoState={params.get("demo") || "success"}
        real={real}
        onNavigate={nav}
      />
    </PhoneFrame>
  );
}

function Display() {
  const [params] = useSearchParams();
  return (
    <>
      <FitStage width={1440} height={810}>
        <QrDisplayPage demoSeconds={Number(params.get("seconds")) || 12} />
      </FitStage>
      <div style={{ position: "fixed", left: 16, bottom: 16, zIndex: 20 }}>
        <BackHome />
      </div>
    </>
  );
}

function Routed({ as: Comp, ...rest }) {
  const nav = useNavigate();
  const auth = useAuth();
  const out = async () => {
    if (await auth.leave()) return;
    nav("/login", { replace: true });
  };
  return <Comp {...rest} onSignOut={out} />;
}

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Page changes: the old screen fades out (150 ms), then the new one fades in and
   rises a few pixels (250 ms). Query-only changes, like ?demo=, do not animate.
   With "reduce motion" on, pages change instantly. */
export default function App() {
  const location = useLocation();
  const [shown, setShown] = useState(location);
  const [phase, setPhase] = useState("in");
  // Always aim for the newest location, so a burst of page changes (for example when signing out)
  // can never leave the screen stuck half way through the fade.
  const latest = useRef(location);
  latest.current = location;
  useEffect(() => {
    if (location.pathname === shown.pathname || reducedMotion()) {
      setShown(location);
      setPhase("in");
      return undefined;
    }
    setPhase("out");
    const t = setTimeout(() => {
      setShown(latest.current);
      setPhase("in");
      window.scrollTo(0, 0);
    }, 150);
    return () => clearTimeout(t);
    // only a change of page restarts the fade; a repeat visit to the same page does not
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
  // same page, new address details (such as ?demo=): update straight away
  useEffect(() => {
    if (location.pathname === shown.pathname && location !== shown)
      setShown(location);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);
  // Inside the management pages the side panel stays mounted: only the page area fades.
  const inAdmin = (p) => p === "/roles" || p.startsWith("/admin");
  const both = inAdmin(shown.pathname) && inAdmin(location.pathname);
  const group = inAdmin(shown.pathname) ? "admin" : shown.pathname;
  const trans = {
    phase,
    contentPhase: both ? phase : "in",
    shownPath: shown.pathname,
    livePath: location.pathname,
  };
  return (
    <PageTransition.Provider value={trans}>
      <div key={group} className={"page page-" + (both ? "in" : phase)}>
        <AppRoutes location={shown} />
      </div>
    </PageTransition.Provider>
  );
}

function AppRoutes({ location }) {
  return (
    <Routes location={location}>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/scan"
        element={
          <Protected need="attendance.scan">
            <Scan />
          </Protected>
        }
      />
      <Route
        path="/display"
        element={
          <Protected need="session.qr_display">
            <Display />
          </Protected>
        }
      />
      <Route
        path="/registrar"
        element={
          <Protected need="attendance.mark_manual">
            <RegistrarPage />
          </Protected>
        }
      />
      <Route element={<AdminLayout />}>
        <Route
          path="/admin"
          element={
            <Protected need="analytics.view">
              <AdminDashboardPage />
            </Protected>
          }
        />
        <Route
          path="/admin/approvals"
          element={
            <Protected need={["account.approve", "registration.view"]}>
              <ApprovalsPage />
            </Protected>
          }
        />
        <Route
          path="/admin/sessions"
          element={
            <Protected need={["session.create", "analytics.view"]}>
              <SessionsPage />
            </Protected>
          }
        />
        <Route
          path="/admin/executives"
          element={
            <Protected need="executive.view_full">
              <ExecutivesPage />
            </Protected>
          }
        />
        <Route
          path="/admin/programs"
          element={
            <Protected need="program.manage">
              <ProgramsPage />
            </Protected>
          }
        />
        <Route
          path="/admin/members"
          element={
            <Protected need="member.view">
              <MembersPage />
            </Protected>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <Protected need="analytics.view">
              <AnalyticsPage />
            </Protected>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <Protected need="analytics.export">
              <ReportsPage />
            </Protected>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <Protected need="audit.view">
              <AuditPage />
            </Protected>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <Protected need="settings.manage">
              <SettingsPage />
            </Protected>
          }
        />
        <Route
          path="/roles"
          element={
            <Protected need="role.assign">
              <RoleAssignmentPage />
            </Protected>
          }
        />
      </Route>
      <Route path="/register" element={<RegisterScreen />} />
      <Route
        path="/first-sign-in"
        element={
          <GateOnly>
            <FirstSignIn />
          </GateOnly>
        }
      />
      <Route
        path="/profile"
        element={
          <Protected need="attendance.scan">
            <ExecutiveProfile />
          </Protected>
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/executives" element={<PublicExecutives />} />
      <Route path="/terms" element={<LegalPage kind="terms" />} />
      <Route path="/privacy" element={<LegalPage kind="privacy" />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
