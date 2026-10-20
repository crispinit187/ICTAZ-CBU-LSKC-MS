import React, { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import LoginScreen from "./screens/LoginScreen.jsx";
import AdminDashboard from "./screens/AdminDashboard.jsx";
import RegistrarMarking from "./screens/RegistrarMarking.jsx";
import QrDisplay from "./screens/QrDisplay.jsx";
import MemberScan from "./screens/MemberScan.jsx";
import RoleAssignment from "./screens/RoleAssignment.jsx";
import RegisterScreen from "./screens/RegisterScreen.jsx";
import FirstSignIn from "./screens/FirstSignIn.jsx";
import ExecutiveProfile from "./screens/ExecutiveProfile.jsx";
import ForgotPassword from "./screens/ForgotPassword.jsx";
import ResetPassword from "./screens/ResetPassword.jsx";
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
  return (
    <LoginScreen
      demoState={params.get("demo") || "wrong"}
      compact={compact}
      onRegister={() => nav("/register")}
      onForgot={(id) =>
        nav("/forgot-password" + (id ? "?id=" + encodeURIComponent(id) : ""))
      }
      onTerms={() => nav("/terms")}
      onPrivacy={() => nav("/privacy")}
    />
  );
}

function Scan() {
  const [params] = useSearchParams();
  return (
    <PhoneFrame>
      <Routed as={MemberScan} demoState={params.get("demo") || "success"} />
    </PhoneFrame>
  );
}

function Display() {
  const [params] = useSearchParams();
  return (
    <FitStage width={1440} height={810}>
      <QrDisplay demoSeconds={Number(params.get("seconds")) || 12} />
    </FitStage>
  );
}

function Routed({ as: Comp, ...rest }) {
  const nav = useNavigate();
  return <Comp {...rest} onSignOut={() => nav("/login")} />;
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
  useEffect(() => {
    if (location.pathname === shown.pathname || reducedMotion()) {
      setShown(location);
      setPhase("in");
      return undefined;
    }
    setPhase("out");
    const t = setTimeout(() => {
      setShown(location);
      setPhase("in");
      window.scrollTo(0, 0);
    }, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);
  return (
    <div key={shown.pathname} className={"page page-" + phase}>
      <AppRoutes location={shown} />
    </div>
  );
}

function AppRoutes({ location }) {
  return (
    <Routes location={location}>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/scan" element={<Scan />} />
      <Route path="/display" element={<Display />} />
      <Route path="/registrar" element={<Routed as={RegistrarMarking} />} />
      <Route path="/admin" element={<Routed as={AdminDashboard} />} />
      <Route path="/roles" element={<Routed as={RoleAssignment} />} />
      <Route path="/register" element={<RegisterScreen />} />
      <Route path="/first-sign-in" element={<FirstSignIn />} />
      <Route path="/profile" element={<ExecutiveProfile />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/terms" element={<LegalPage kind="terms" />} />
      <Route path="/privacy" element={<LegalPage kind="privacy" />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
