import { supabase } from "./supabase.js";
import { shrink } from "./picture.js";

export const POSTER_BUCKET = "session-posters";
export const POSTER_MAX_BYTES = 3 * 1024 * 1024;
export const POSTER_TYPES = ["image/jpeg", "image/png", "image/webp"];

/* Address of a stored poster, or null. */
export function posterUrl(path) {
  if (!path || !supabase) return null;
  return supabase.storage.from(POSTER_BUCKET).getPublicUrl(path).data.publicUrl;
}

/* Checks a chosen file. Returns an error text, or null when it is fine. */
export function checkPoster(file) {
  if (!POSTER_TYPES.includes(file.type))
    return "Choose a JPG, PNG or WebP picture for the poster.";
  if (file.size > POSTER_MAX_BYTES)
    return "That poster is over 3 MB. Choose a smaller one.";
  return null;
}

const rand = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");

/* Uploads a poster for a session. Resolves { path } or { error }. */
export async function uploadPoster(sessionId, file) {
  const bad = checkPoster(file);
  if (bad) return { error: bad };
  let blob;
  try {
    blob = await shrink(file, 1400);
  } catch (e) {
    return { error: "That file could not be read as a picture." };
  }
  const path = sessionId + "/" + rand() + ".jpg";
  const up = await supabase.storage
    .from(POSTER_BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (up.error)
    return { error: "The poster could not be uploaded. Try again." };
  return { path };
}

/* Deletes a poster file. */
export async function removePosterFile(path) {
  if (path && supabase)
    await supabase.storage.from(POSTER_BUCKET).remove([path]);
}
