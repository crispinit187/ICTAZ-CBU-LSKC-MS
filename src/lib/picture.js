import { supabase } from "./supabase.js";

export const BUCKET = "executive-pictures";
export const MAX_BYTES = 10 * 1024 * 1024;
export const TYPES = ["image/jpeg", "image/png", "image/webp"];

/* Address of a stored picture, or null. */
export function pictureUrl(path) {
  if (!path || !supabase) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/* Shrinks a picture to at most 800 pixels on its longest side and returns a JPEG file. */
export function shrink(file, max = 800) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const g = c.getContext("2d");
      g.fillStyle = "#fff";
      g.fillRect(0, 0, w, h);
      g.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      c.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("shrink failed"))),
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("not a picture"));
    };
    img.src = url;
  });
}

const rand = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");

/* Uploads a picture for the signed-in executive. Resolves { path } or { error }. */
export async function uploadPicture(memberId, file) {
  if (!TYPES.includes(file.type))
    return { error: "Choose a JPG, PNG or WebP picture." };
  if (file.size > MAX_BYTES)
    return { error: "That picture is over 10 MB. Choose a smaller one." };
  let blob;
  try {
    blob = await shrink(file);
  } catch (e) {
    return { error: "That file could not be read as a picture." };
  }
  const path = memberId + "/" + rand() + ".jpg";
  const up = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (up.error)
    return { error: "The picture could not be uploaded. Try again." };
  return { path };
}

export async function removeFile(path) {
  if (path && supabase) await supabase.storage.from(BUCKET).remove([path]);
}
