// Edge Function: send-queued-emails
// Sends the rows waiting in public.email_queue through an SMTP account (Gmail by default),
// using the wording saved on the Settings page (public.email_templates).
// Any signed-in member may call it. It takes no input, so the caller cannot choose what is sent.
// The app calls it right after an action that queues an e-mail (approval, role change, ...).
//
// Secrets (Supabase > Edge Functions > Secrets):
//   SMTP_USER   the sending address, e.g. yourname@gmail.com
//   SMTP_PASS   the Gmail app password (16 characters, no spaces)
//   SMTP_HOST   optional, default smtp.gmail.com
//   SMTP_PORT   optional, default 465
//
// Deploy:  supabase functions deploy send-queued-emails --no-verify-jwt --use-api
//
// Reply: 200 { ok: true, sent, failed }    4xx/5xx { message }

import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const MAX_ATTEMPTS = 3;
const BATCH = 20;

function fill(text: string, data: Record<string, unknown>): string {
  return (text || "").replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_m, k) => String(data[k] ?? ""));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { message: "Method not allowed." });

  const url = Deno.env.get("SUPABASE_URL")!;
  const auth = req.headers.get("Authorization") ?? "";
  const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: u } = await asUser.auth.getUser();
  if (!u?.user) return json(401, { message: "Sign in first." });

  const user = Deno.env.get("SMTP_USER");
  const pass = Deno.env.get("SMTP_PASS");
  if (!user || !pass) return json(503, { message: "Email sending is not set up yet." });

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: rows, error } = await admin
    .from("email_queue")
    .select("id, template_code, to_email, payload, attempts")
    .eq("status", "queued")
    .lt("attempts", MAX_ATTEMPTS)
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(BATCH);
  if (error) return json(500, { message: "Could not read the queue." });
  if (!rows || rows.length === 0) return json(200, { ok: true, sent: 0, failed: 0 });

  const { data: templates } = await admin
    .from("email_templates")
    .select("code, subject, body, sender_name, reply_to, signature");
  const byCode = new Map((templates ?? []).map((t) => [t.code, t]));

  const transport = nodemailer.createTransport({
    host: Deno.env.get("SMTP_HOST") ?? "smtp.gmail.com",
    port: Number(Deno.env.get("SMTP_PORT") ?? "465"),
    secure: Number(Deno.env.get("SMTP_PORT") ?? "465") === 465,
    auth: { user, pass },
  });

  let sent = 0;
  let failed = 0;
  for (const r of rows) {
    const t = byCode.get(r.template_code);
    try {
      if (!t) throw new Error("No template named " + r.template_code);
      const data = (r.payload ?? {}) as Record<string, unknown>;
      const text = fill(t.body, data) + (t.signature ? "\n\n" + t.signature : "");
      await transport.sendMail({
        from: `"${(t.sender_name || "ICTAZ CBU LSKC").replace(/"/g, "")}" <${user}>`,
        to: r.to_email,
        replyTo: t.reply_to || undefined,
        subject: fill(t.subject, data),
        text,
      });
      await admin.from("email_queue").update({ status: "sent", sent_at: new Date().toISOString(), attempts: r.attempts + 1, last_error: null }).eq("id", r.id);
      sent++;
    } catch (e) {
      const attempts = r.attempts + 1;
      await admin
        .from("email_queue")
        .update({ status: attempts >= MAX_ATTEMPTS ? "failed" : "queued", attempts, last_error: String((e as Error).message ?? e).slice(0, 300) })
        .eq("id", r.id);
      failed++;
    }
  }
  return json(200, { ok: true, sent, failed });
});
