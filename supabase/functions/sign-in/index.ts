// Edge Function: sign-in
// Lets a person sign in with a student number (or the reserved identifier "admin") as well as
// an email. Supabase Auth only signs in by email, so this function finds the email on the
// server, so student numbers never reveal anyone's email address to the browser.
// It also applies the sign-in delay after repeated failures (SRS 7.6) and gives the same answer
// for "no such account" and "wrong password" (AU-10).
//
// Deploy:  supabase functions deploy sign-in
// Needs the default function secrets (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY).
// The service key stays inside Supabase. It is never sent to the front end.
//
// Request:  POST { identifier: string, password: string }
// Success:  200 { session }                       (pass to supabase.auth.setSession)
// Failure:  401 { code: "invalid" }               wrong details, or no such account
//           403 { code: "unconfirmed" }           right password, email not confirmed yet
//           429 { code: "delay", retry_after }    too many attempts
//           400 { code: "bad_request" }

import { createClient } from "npm:@supabase/supabase-js@2";

const MAX_FAILURES = 5; // TODO: read from public.settings once the Super Admin screen exists
const WINDOW_SECONDS = 600;
const DELAY_SECONDS = 30;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { code: "bad_request" });

  let identifier = "";
  let password = "";
  try {
    const body = await req.json();
    identifier = String(body.identifier ?? "").trim();
    password = String(body.password ?? "");
  } catch {
    return json(400, { code: "bad_request" });
  }

  const isStudent = /^\d{8}$/.test(identifier);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(identifier);
  const isAdmin = identifier.toLowerCase() === "admin";
  if ((!isStudent && !isEmail && !isAdmin) || !password || password.length > 200) {
    return json(400, { code: "bad_request" });
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });

  // ---- rate limit, counted per identifier
  const key = "signin:" + identifier.toLowerCase();
  const now = Date.now();
  const { data: row } = await admin.from("rate_limit_counters").select("*").eq("key", key).maybeSingle();
  let count = 0;
  let windowStart = now;
  if (row && now - new Date(row.window_start).getTime() < WINDOW_SECONDS * 1000) {
    count = row.count;
    windowStart = new Date(row.window_start).getTime();
  }
  if (count >= MAX_FAILURES) {
    const last = row ? new Date(row.last_attempt).getTime() : now;
    const wait = Math.max(1, Math.ceil((last + DELAY_SECONDS * 1000 - now) / 1000));
    if (now - last < DELAY_SECONDS * 1000) return json(429, { code: "delay", retry_after: wait });
  }

  const fail = async () => {
    await admin.from("rate_limit_counters").upsert({
      key,
      window_start: new Date(windowStart).toISOString(),
      count: count + 1,
      last_attempt: new Date().toISOString(),
    });
    return json(401, { code: "invalid" });
  };

  // ---- find the email behind the identifier
  let email = isEmail ? identifier : "";
  if (!isEmail) {
    const q = admin.from("members").select("email");
    const { data } = isAdmin
      ? await q.eq("is_bootstrap", true).maybeSingle()
      : await q.eq("student_number", identifier).maybeSingle();
    email = data?.email ?? "";
  }
  if (!email) return await fail();

  // ---- check the password with Supabase Auth
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error && (error as { code?: string }).code === "email_not_confirmed") {
    // Supabase checks the password first, so this only reaches a person who knows it.
    return json(403, { code: "unconfirmed" });
  }
  if (error || !data.session) return await fail();

  await admin.from("rate_limit_counters").delete().eq("key", key);
  return json(200, { session: data.session });
});
