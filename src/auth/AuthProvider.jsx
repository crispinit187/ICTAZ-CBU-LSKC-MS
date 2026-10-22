import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { configured, supabase } from "../lib/supabase.js";

/* Who is signed in, what they may do, and what they must finish first.
   The database decides all of this through my_context(); the front end only reads it.
   Hiding a button here is a convenience. The database enforces the real rules. */

const Ctx = createContext(null);
// Name of the deployed sign-in Edge Function. Set VITE_SIGNIN_FUNCTION if it was deployed under another name.
const SIGN_IN_FUNCTION = import.meta.env.VITE_SIGNIN_FUNCTION || "sign-in";

// Never leave a screen waiting forever: give up after 20 seconds.
const withTimeout = (promise, result) =>
  Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(result), 20000)),
  ]);

export const useAuth = () => useContext(Ctx);

export const STAFF_ROLES = [
  "Registrar",
  "Reviewer",
  "Administrator",
  "Super Admin",
];

export function gateOf(ctx) {
  if (!ctx || ctx.status !== "Active") return null;
  if (ctx.must_change_password) return ctx.is_bootstrap ? "bootstrap" : "temp";
  if (ctx.pending_docs && ctx.pending_docs.length) return "terms";
  return null;
}

export function homeFor(ctx) {
  const p = (ctx && ctx.permissions) || [];
  if (p.includes("analytics.view")) return "/admin";
  if (p.includes("attendance.mark_manual")) return "/registrar";
  return "/scan";
}

export const can = (ctx, code) =>
  !!ctx && (ctx.permissions || []).includes(code);

async function loadContext() {
  const { data, error } = await supabase.rpc("my_context");
  if (error) return { ctx: null, error: error.message };
  return { ctx: data || null, error: null };
}

const FUNCTION_MISSING = (e) =>
  !!e &&
  (e.name === "FunctionsFetchError" || (e.context && e.context.status === 404));

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    ready: !configured,
    session: null,
    ctx: null,
    error: null,
  });
  const alive = useRef(true);

  const refresh = useCallback(async (session) => {
    if (!configured) return null;
    let s = session;
    if (s === undefined) {
      const { data } = await supabase.auth.getSession();
      s = data.session;
    }
    if (!s) {
      if (alive.current)
        setState({ ready: true, session: null, ctx: null, error: null });
      return null;
    }
    const { ctx, error } = await loadContext();
    if (alive.current) setState({ ready: true, session: s, ctx, error });
    return ctx;
  }, []);

  useEffect(() => {
    alive.current = true;
    if (!configured) return undefined;
    refresh();
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") {
        setState((s) => ({ ...s, session }));
        return;
      }
      // Do not call Supabase from inside this callback: defer it.
      setTimeout(() => refresh(session), 0);
    });
    return () => {
      alive.current = false;
      data.subscription.unsubscribe();
    };
  }, [refresh]);

  /* Returns { ok: true, ctx } or { error }, where error is one of:
     invalid | wrong | delay | pending | suspended | unconfirmed | unavailable | no_account */
  const signInInner = useCallback(
    async (identifier, password) => {
      if (!configured) return { error: "unavailable" };
      const id = identifier.trim();
      const isEmail = id.includes("@");
      let session = null;

      const viaFunction = await supabase.functions.invoke(SIGN_IN_FUNCTION, {
        body: { identifier: id, password },
      });
      if (!viaFunction.error && viaFunction.data && viaFunction.data.session) {
        session = viaFunction.data.session;
        const set = await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
        if (set.error) return { error: "unavailable" };
      } else if (viaFunction.error && FUNCTION_MISSING(viaFunction.error)) {
        // The sign-in function is not deployed yet. Email sign-in can still go straight to Supabase Auth.
        if (!isEmail) return { error: "unavailable_student" };
        const { data, error } = await supabase.auth.signInWithPassword({
          email: id,
          password,
        });
        if (error) {
          if (error.code === "email_not_confirmed")
            return { error: "unconfirmed" };
          if (error.status === 429 || error.code === "over_request_rate_limit")
            return { error: "delay", retryAfter: 30 };
          if (!error.status || error.name === "AuthRetryableFetchError")
            return { error: "unavailable" };
          return { error: "wrong" };
        }
        session = data.session;
      } else if (viaFunction.error) {
        const res = viaFunction.error.context;
        let body = null;
        try {
          body = res && res.json ? await res.json() : null;
        } catch {
          body = null;
        }
        if (body && body.code === "delay")
          return { error: "delay", retryAfter: body.retry_after || 30 };
        if (body && body.code === "invalid") return { error: "wrong" };
        if (body && body.code === "unconfirmed")
          return { error: "unconfirmed" };
        if (body && body.code === "bad_request") return { error: "invalid" };
        return { error: "unavailable" };
      } else {
        return { error: "wrong" };
      }

      const ctx = await refresh(session);
      if (!ctx) {
        // Signed in with Google or Auth but there is no member record: never create one here.
        await supabase.auth.signOut();
        return { error: "no_account" };
      }
      if (ctx.status === "Pending") {
        await supabase.auth.signOut();
        return { error: "pending" };
      }
      if (ctx.status !== "Active") {
        await supabase.auth.signOut();
        return { error: "suspended" };
      }
      return { ok: true, ctx };
    },
    [refresh],
  );

  const signIn = useCallback(
    (identifier, password) =>
      withTimeout(signInInner(identifier, password), { error: "unavailable" }),
    [signInInner],
  );

  const signInWithGoogle = useCallback(async () => {
    if (!configured) return { error: "unavailable" };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + import.meta.env.BASE_URL + "login",
      },
    });
    return error ? { error: "unavailable" } : { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    if (configured) await supabase.auth.signOut();
    setState({ ready: true, session: null, ctx: null, error: null });
  }, []);

  /* Signs out and loads the sign-in page fresh, so no old screen or data can be left
     behind. Returns false when there is no backend to sign out of (demo). */
  const leave = useCallback(async () => {
    if (!configured) return false;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      /* the page is reloaded either way */
    }
    window.location.replace(import.meta.env.BASE_URL + "login");
    return true;
  }, []);

  /* First sign-in: new password (if required), then accept the documents. */
  const completeInner = useCallback(
    async ({ current, password, email, acceptIds }) => {
      const ctx = state.ctx;
      if (!configured || !ctx) return { error: "unavailable" };
      if (password) {
        // Prove the temporary password again before replacing it.
        const check = await supabase.auth.signInWithPassword({
          email: ctx.email,
          password: current,
        });
        if (check.error) return { error: "current_wrong" };
        const update = await supabase.auth.updateUser(
          email && email !== ctx.email ? { password, email } : { password },
        );
        if (update.error) {
          if (update.error.code === "same_password")
            return { error: "same_password" };
          if (update.error.code === "email_address_invalid")
            return { error: "email_invalid" };
          if (update.error.code === "weak_password")
            return { error: "weak_password" };
          return { error: "unavailable" };
        }
      }
      const acc = await supabase.rpc("accept_terms", {
        p_ids: acceptIds || [],
      });
      if (acc.error) return { error: "accept_failed" };
      const next = await refresh();
      return { ok: true, ctx: next };
    },
    [refresh, state.ctx],
  );

  const completeFirstSignIn = useCallback(
    (args) => withTimeout(completeInner(args), { error: "timeout" }),
    [completeInner],
  );

  const value = useMemo(
    () => ({
      configured,
      ready: state.ready,
      session: state.session,
      ctx: state.ctx,
      error: state.error,
      gate: gateOf(state.ctx),
      signIn,
      signInWithGoogle,
      signOut,
      leave,
      completeFirstSignIn,
      refresh,
    }),
    [
      state,
      signIn,
      signInWithGoogle,
      signOut,
      leave,
      completeFirstSignIn,
      refresh,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
