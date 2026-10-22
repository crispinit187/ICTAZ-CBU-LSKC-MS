import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/* True when both values are in .env.local. Without them the app still runs on its sample data. */
export const configured = Boolean(url && key);

/* Local development only: lets you open every screen without an account while the database
   has no users yet. Never set this in a deployed build. */
export const demoOpen = import.meta.env.VITE_DEMO_OPEN === "true";

/* Only the project URL and the public key belong here. The service key and the database
   password must never be placed in this app. */
export const supabase = configured
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
