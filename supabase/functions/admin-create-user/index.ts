// Edge Function: admin-create-user
// An Administrator makes an account for a member (for example someone without an email they check often).
// The account is Active straight away, with a temporary password that is shown once.
// The member must choose their own password at first sign-in.
//
// Deploy:  supabase functions deploy admin-create-user --no-verify-jwt --use-api
// (The function checks the caller's token and permission itself.)
//
// Request:  POST { name, student_number, email, program, year_of_study, semester_of_study }
// Reply:    200 { ok: true, member_id, temporary_password }
//           4xx { message }

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

  // who is calling, and may they do this?
  const { data: who } = await user.auth.getUser();
  if (!who?.user) return json(401, { message: "Please sign in again." });
  const { data: ctx } = await user.rpc("my_context");
  if (!ctx || ctx.status !== "Active" || ctx.must_change_password || !(ctx.permissions ?? []).includes("account.create")) {
    return json(403, { message: "You are not allowed to create accounts." });
  }

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return json(400, { message: "Bad request." });
  }
  const name = String(b.name ?? "").trim();
  const student = String(b.student_number ?? "").trim();
  const email = String(b.email ?? "").trim().toLowerCase();
  const program = String(b.program ?? "").trim();
  const year = Number(b.year_of_study);
  const sem = Number(b.semester_of_study);
  if (name.length < 2) return json(400, { message: "Name is required." });
  if (!/^\d{8}$/.test(student)) return json(400, { message: "A student number is exactly 8 digits." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json(400, { message: "Enter a valid email address." });
  if (!program) return json(400, { message: "Programme is required." });
  if (!(year >= 1 && year <= 5) || !(sem === 1 || sem === 2)) return json(400, { message: "Choose year and semester." });

  const { data: taken } = await admin.from("members").select("id").eq("student_number", student).maybeSingle();
  if (taken) return json(409, { message: "That student number is already registered." });

  const password = tempPassword();
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, student_number: student, program, year_of_study: String(year), semester_of_study: String(sem) },
  });
  if (created.error || !created.data.user) {
    const m = created.error?.message ?? "";
    return json(/already|registered|exists/i.test(m) ? 409 : 500, {
      message: /already|registered|exists/i.test(m) ? "That email address already has an account." : "Could not create the account.",
    });
  }
  const id = created.data.user.id;

  // approved on creation; the temporary password must be replaced at first sign-in
  const up = await admin
    .from("members")
    .update({ status: "Active", status_reason: null, must_change_password: true })
    .eq("id", id);
  if (up.error) {
    await admin.auth.admin.deleteUser(id);
    return json(500, { message: "Could not finish creating the account." });
  }

  const role = (ctx.roles ?? []).includes("Super Admin") ? "Super Admin" : "Administrator";
  await admin.from("audit_log").insert({
    actor_id: who.user.id,
    actor_role: role,
    action: "member.created",
    module: "core",
    target_type: "member",
    target_id: id,
    after: { student_number: student, email },
  });
  const tpl = await admin.from("email_templates").select("code").eq("code", "account_created").maybeSingle();
  if (tpl.data) {
    await admin.from("email_queue").insert({ template_code: "account_created", to_email: email, payload: { name } });
  }
  return json(200, { ok: true, member_id: id, temporary_password: password });
});
