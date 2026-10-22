/* Turns the before/after values kept in an audit entry into plain rows. */
const LABELS = {
  public_display: "Shown on the public page",
  consent: "Consent to publish",
  exec_public_consent: "Consent to publish",
  member_since: "Member since",
  start_date: "Start date",
  end_date: "End date",
  start_at: "Starts",
  student_number: "Student number",
  name: "Name",
  title: "Title",
  position: "Position",
  program: "Programme",
  phone: "Phone",
  status: "Status",
  role: "Role",
  venue: "Venue",
  reason: "Reason",
  doc_type: "Document",
  version: "Version",
  session_title: "Session",
  profile_id: "Executive profile",
  year_of_study: "Year of study",
  semester_of_study: "Semester of study",
  email: "Email",
  qr_rotation_seconds: "QR code changes every (seconds)",
  qr_grace_seconds: "QR grace time (seconds)",
};

const pretty = (k) => {
  const t = String(k).replace(/[_.]+/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};
export const labelFor = (k) => LABELS[k] || pretty(k);

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const STAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export function valueText(v) {
  if (v === null || v === undefined || v === "") return "(none)";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v))
    return v.length ? v.map(valueText).join(", ") : "(none)";
  if (typeof v === "object")
    return (
      Object.keys(v)
        .map((k) => labelFor(k) + ": " + valueText(v[k]))
        .join("; ") || "(none)"
    );
  if (typeof v === "string" && DATE_ONLY.test(v))
    return new Date(v + "T00:00:00").toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  if (typeof v === "string" && STAMP.test(v) && !isNaN(new Date(v)))
    return new Date(v).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  return String(v);
}

/* [{ label, before, after }] with one row per field that appears on either side. */
export function auditRows(before, after) {
  const b = before && typeof before === "object" ? before : {};
  const a = after && typeof after === "object" ? after : {};
  const keys = [...Object.keys(b)];
  Object.keys(a).forEach((k) => keys.indexOf(k) < 0 && keys.push(k));
  return keys.map((k) => ({
    label: labelFor(k),
    before: valueText(b[k]),
    after: valueText(a[k]),
    hadBefore: k in b,
  }));
}
