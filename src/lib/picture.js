import { supabase } from "./supabase.js";

export const BUCKET = "executive-pictures";
export const MAX_BYTES = 10 * 1024 * 1024;
export const TYPES = ["image/jpeg", "image/png", "image/webp"];

/* Address of a stored picture, or null. */
export function pictureUrl(path) {
  if (!path || !supabase) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/* The cropped circle version sits next to the full picture: <name>-c.jpg */
export const thumbPath = (path) =>
  path ? path.replace(/\.jpg$/, "-c.jpg") : null;
export const thumbUrl = (path) => pictureUrl(thumbPath(path));

/* Reads a chosen file as an image. Resolves { img, url } (call URL.revokeObjectURL when done). */
export function readImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("not a picture"));
    };
    img.src = url;
  });
}

/* Checks a chosen file. Returns an error text, or null when it is fine. */
export function checkFile(file) {
  if (!TYPES.includes(file.type)) return "Choose a JPG, PNG or WebP picture.";
  if (file.size > MAX_BYTES)
    return "That picture is over 10 MB. Choose a smaller one.";
  return null;
}

/* Cuts a square (sx, sy, size) out of an image as a 400 pixel JPEG. */
export function cropSquare(img, sx, sy, size, out = 400) {
  return new Promise((resolve, reject) => {
    const c = document.createElement("canvas");
    c.width = out;
    c.height = out;
    const g = c.getContext("2d");
    g.fillStyle = "#fff";
    g.fillRect(0, 0, out, out);
    g.drawImage(img, sx, sy, size, size, 0, 0, out, out);
    c.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("crop failed"))),
      "image/jpeg",
      0.88,
    );
  });
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

/* Uploads the full picture and its circle version for the signed-in executive.
   Resolves { path } or { error }. The full picture is the one that is recorded. */
export async function uploadPicture(memberId, file, thumbBlob) {
  const bad = checkFile(file);
  if (bad) return { error: bad };
  let blob;
  try {
    blob = await shrink(file);
  } catch (e) {
    return { error: "That file could not be read as a picture." };
  }
  const path = memberId + "/" + rand() + ".jpg";
  const opts = { contentType: "image/jpeg", upsert: false };
  const up = await supabase.storage.from(BUCKET).upload(path, blob, opts);
  if (up.error)
    return { error: "The picture could not be uploaded. Try again." };
  if (thumbBlob) {
    const t = await supabase.storage
      .from(BUCKET)
      .upload(thumbPath(path), thumbBlob, opts);
    if (t.error) {
      await supabase.storage.from(BUCKET).remove([path]);
      return { error: "The picture could not be uploaded. Try again." };
    }
  }
  return { path };
}

/* Removes a picture and its circle version. */
export async function removeFile(path) {
  if (path && supabase)
    await supabase.storage.from(BUCKET).remove([path, thumbPath(path)]);
}
