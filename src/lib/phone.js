// Zambian numbers: 0971234567, 260971234567 and +260 97 123 4567 all become +260971234567.
// Returns null for anything else (and for an empty value).
export function normalisePhone(value) {
  const d = String(value || "").replace(/[^0-9]/g, "");
  if (!d) return null;
  if (/^260[0-9]{9}$/.test(d)) return "+" + d;
  if (/^0[0-9]{9}$/.test(d)) return "+260" + d.slice(1);
  if (/^[0-9]{9}$/.test(d)) return "+260" + d;
  return null;
}
