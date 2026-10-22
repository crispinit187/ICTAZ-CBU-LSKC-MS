// Edge Function: forgot-password
// Sends a reset link when the person gives a student number (Supabase Auth only knows emails).
// The answer is always the same, whether or not an account matches, so nobody can use it to
// find out who is registered (AU-19). Only Active accounts get a link.
//
// Deploy:  supabase functions deploy forgot-password --no-verify-jwt --use-api
//
// Request:  POST { identifier: string, redirectTo: string }
// Reply:    200 { ok: true }                          always, when the request was well formed
//           429 { code: "delay", retry_after }        too many tries
//           400 { code: "bad_request" }

import { createClient } from "npm:@supabase/supabase-js@2";

const MAX_TRIES = 5;
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
  let redirectTo = "";
  try {
    const body = await req.json();
    identifier = String(body.identifier ?? "").trim();
    redirectTo = String(body.redirectTo ?? "");
  } catch {
    return json(400, { code: "bad_request" });
  }
  const isStudent = /^\d{8}$/.test(identifier);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(identifier);
  if (!isStudent && !isEmail) return json(400, { code: "bad_request" });

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });

  // rate limit per identifier
  const key = "forgot:" + identifier.toLowerCase();
  const now = Date.now();
  const { data: row } = await admin.from("rate_limit_counters").select("*").eq("key", key).maybeSingle();
  let count = 0;
  let windowStart = now;
  if (row && now - new Date(row.window_start).getTime() < WINDOW_SECONDS * 1000) {
    count = row.count;
    windowStart = new Date(row.window_start).getTime();
  }
  if (count >= MAX_TRIES) {
    const last = row ? new Date(row.last_attempt).getTime() : now;
    if (now - last < DELAY_SECONDS * 1000) {
      return json(429, { code: "delay", retry_after: Math.ceil((last + DELAY_SECONDS * 1000 - now) / 1000) });
    }
  }
  await admin.from("rate_limit_counters").upsert({
    key,
    window_start: new Date(windowStart).toISOString(),
    count: count + 1,
    last_attempt: new Date().toISOString(),
  });

  // find the email of an Active account, then ask Supabase Auth to send the link
  const q = admin.from("members").select("email,status");
  const { data } = isStudent
    ? await q.eq("student_number", identifier).maybeSingle()
    : await q.eq("email", identifier).maybeSingle();
  if (data && data.status === "Active") {
    await anon.auth.resetPasswordForEmail(data.email, { redirectTo });
  }
  return json(200, { ok: true });
});
