import { configured, demoOpen, supabase } from "./supabase.js";

/* True when screens should talk to the database. Without it they show sample data. */
export const live = () => configured && !demoOpen;

const FRIENDLY = {
  42501: "You are not allowed to do that.",
  28000: "Please sign in again.",
  23505: "That value is already used.",
  23514: "That change is not allowed.",
  P0002: "That record was not found or has already changed.",
};

/* Sends any e-mails the last action queued. Quiet: a problem here never disturbs the action. */
const MAILS = new Set([
  "approve_registration",
  "decline_registration",
  "set_member_status",
  "assign_role",
  "remove_role",
  "note_password_changed",
]);
let flushing = false;
function flushEmails() {
  if (flushing) return;
  flushing = true;
  setTimeout(() => {
    flushing = false;
    try {
      supabase.functions
        .invoke("send-queued-emails", { body: {} })
        .catch(() => {});
    } catch (e) {
      /* ignore */
    }
  }, 1500);
}

/* Calls a database function. Always resolves to { data, error } where error is plain text. */
export async function rpc(name, args) {
  if (!live()) return { data: null, error: "Not connected to the database." };
  try {
    const { data, error } = await supabase.rpc(name, args || {});
    if (error) {
      const msg =
        error.message && !/^[A-Z_]+$/.test(error.message)
          ? error.message
          : FRIENDLY[error.code] || "Something went wrong.";
      return {
        data: null,
        error: error.code === "42501" ? FRIENDLY["42501"] : msg,
      };
    }
    if (MAILS.has(name)) flushEmails();
    return { data, error: null };
  } catch (e) {
    return { data: null, error: "Could not reach the server. Try again." };
  }
}

/* Calls an Edge Function with the signed-in user's token. */
export async function callFunction(name, body) {
  if (!live()) return { data: null, error: "Not connected to the database." };
  try {
    const { data, error } = await supabase.functions.invoke(name, { body });
    if (error) {
      let msg = "Something went wrong.";
      try {
        const j = await error.context.json();
        if (j && j.message) msg = j.message;
        else if (j && j.code) msg = j.code;
      } catch (e) {
        /* keep default */
      }
      return { data: null, error: msg };
    }
    if (name === "admin-create-user" || name === "admin-reset-password")
      flushEmails();
    return { data, error: null };
  } catch (e) {
    return { data: null, error: "Could not reach the server. Try again." };
  }
}

export function ago(iso) {
  const t = new Date(iso).getTime();
  if (!t) return "";
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return "Just now";
  if (s < 3600) return Math.round(s / 60) + " min ago";
  if (s < 86400) return Math.round(s / 3600) + " h ago";
  if (s < 172800) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

const ACTION_TEXT = {
  "registration.approved": "Approved a registration",
  "registration.declined": "Declined a registration",
  "registration.reopened": "Reopened a declined registration",
  "member.status_changed": "Changed a member's status",
  "member.details_changed": "Edited a member's details",
  "member.student_number_changed": "Changed a student number",
  "member.created": "Created an account",
  "member.password_reset": "Issued a password reset",
  "terms.accepted": "Accepted the terms",
};
export const actionText = (a) =>
  ACTION_TEXT[a] ||
  (a || "").replace(/[._]/g, " ").replace(/^./, (c) => c.toUpperCase());
