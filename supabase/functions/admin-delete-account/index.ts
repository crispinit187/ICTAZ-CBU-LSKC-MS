// Edge Function: admin-delete-account
// A Super Admin deletes an account but keeps the records. The database step (erase_member) does the
// permission checks and erases the personal details; this function then removes the picture files and the sign-in.
//
// Deploy:  supabase functions deploy admin-delete-account --no-verify-jwt --use-api
//
// Request:  POST { member_id, reason, request_id? }
//           request_id is given when approving a member's own request (the account is deactivated and deleted in one step).
// Reply:    200 { ok: true }    4xx/5xx { message }

import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const BUCKET = "executive-pictures";
const thumb = (p: string) => p.replace(/\.jpg$/i, "-c.jpg");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { message: "Method not allowed." });

  const url = Deno.env.get("SUPABASE_URL")!;
  const auth = req.headers.get("Authorization") ?? "";
  const user = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    auth: { persistSession: false },
    global: { headers: { Authorization: auth } },
  });
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  const { data: who } = await user.auth.getUser();
  if (!who?.user) return json(401, { message: "Please sign in again." });

  let memberId = "";
  let reason = "";
  let requestId: string | null = null;
  try {
    const b = await req.json();
    memberId = String(b.member_id ?? "");
    reason = String(b.reason ?? "");
    requestId = b.request_id ? String(b.request_id) : null;
  } catch {
    return json(400, { message: "Bad request." });
  }
  const uuid = /^[0-9a-f-]{36}$/i;
  if (!uuid.test(memberId) || (requestId && !uuid.test(requestId))) return json(400, { message: "Bad request." });

  // 1. the database step: checks the caller may do this, then erases the personal details
  const { data, error } = await user.rpc("erase_member", { p_member: memberId, p_reason: reason, p_request: requestId });
  if (error) {
    const status = error.code === "42501" ? 403 : 400;
    return json(status, { message: error.message && error.message !== "not allowed" ? error.message : "You are not allowed to delete accounts." });
  }

  // 2. the picture files (the paths came from the database, plus anything left in the member's own folder)
  const paths = new Set<string>();
  for (const p of (data?.paths ?? []) as string[]) {
    paths.add(p);
    paths.add(thumb(p));
  }
  const listed = await admin.storage.from(BUCKET).list(memberId, { limit: 100 });
  for (const f of listed.data ?? []) paths.add(`${memberId}/${f.name}`);
  if (paths.size > 0) await admin.storage.from(BUCKET).remove([...paths]);

  // 3. the sign-in (a missing user is fine: this step can be repeated)
  const del = await admin.auth.admin.deleteUser(memberId);
  if (del.error && !/not found/i.test(del.error.message)) {
    return json(500, { message: "The records were erased but the sign-in could not be removed. Try Delete again." });
  }
  return json(200, { ok: true });
});
