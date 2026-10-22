// Edge Function: admin-reset-password
// An Administrator gives a member a new temporary password (shown once). The member must
// choose their own at the next sign-in. Only a Super Admin may reset a Super Admin.
//
// Deploy:  supabase functions deploy admin-reset-password --no-verify-jwt --use-api
//
// Request:  POST { member_id }
// Reply:    200 { ok: true, temporary_password }    4xx { message }

import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

function tempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digit = "23456789";
  const all = upper + lower + digit;
  const pick = (set: string) => set[crypto.getRandomValues(new Uint32Array(1))[0] % set.length];
  const chars = [pick(upper), pick(lower), pick(digit)];
  while (chars.length < 12) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

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
  const { data: ctx } = await user.rpc("my_context");
  if (!ctx || ctx.status !== "Active" || ctx.must_change_password || !(ctx.permissions ?? []).includes("account.reset_password")) {
    return json(403, { message: "You are not allowed to reset passwords." });
  }

  let memberId = "";
  try {
    memberId = String((await req.json()).member_id ?? "");
  } catch {
    return json(400, { message: "Bad request." });
  }
  if (!/^[0-9a-f-]{36}$/i.test(memberId)) return json(400, { message: "Bad request." });
  if (memberId === who.user.id) return json(400, { message: "Change your own password from your profile." });

  const { data: m } = await admin.from("members").select("id,name,email,status").eq("id", memberId).maybeSingle();
  if (!m || m.status !== "Active") return json(404, { message: "Only Active members can have a password reset." });

  const { data: roles } = await admin
    .from("user_roles")
    .select("is_active, roles(name)")
    .eq("user_id", memberId)
    .eq("is_active", true);
  const targetIsSuper = (roles ?? []).some((r: any) => r.roles?.name === "Super Admin");
  const callerIsSuper = (ctx.roles ?? []).includes("Super Admin");
  if (targetIsSuper && !callerIsSuper) return json(403, { message: "Only a Super Admin can reset a Super Admin." });

  const password = tempPassword();
  const upd = await admin.auth.admin.updateUserById(memberId, { password });
  if (upd.error) return json(500, { message: "Could not reset the password." });
  // after the password change, so the first-sign-in step is required again
  await admin.from("members").update({ must_change_password: true }).eq("id", memberId);

  await admin.from("audit_log").insert({
    actor_id: who.user.id,
    actor_role: callerIsSuper ? "Super Admin" : "Administrator",
    action: "member.password_reset",
    module: "core",
    target_type: "member",
    target_id: memberId,
  });
  const tpl = await admin.from("email_templates").select("code").eq("code", "password_reset_admin").maybeSingle();
  if (tpl.data) {
    await admin.from("email_queue").insert({ template_code: "password_reset_admin", to_email: m.email, payload: { name: m.name } });
  }
  return json(200, { ok: true, temporary_password: password });
});
