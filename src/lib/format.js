const t = (iso) =>
  new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
const d = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

/* "Wed 22 Oct · 16:00 to 17:30 · Main Hall" */
export function whenText(startIso, endIso, venue) {
  if (!startIso) return "";
  const today = new Date().toDateString() === new Date(startIso).toDateString();
  return (
    (today ? "Today" : d(startIso)) +
    " · " +
    t(startIso) +
    (endIso ? " to " + t(endIso) : "") +
    (venue ? " · " + venue : "")
  );
}

/* value for <input type="datetime-local"> from an ISO string, in the browser's time zone */
export function toLocalInput(iso) {
  if (!iso) return "";
  const x = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return (
    x.getFullYear() +
    "-" +
    p(x.getMonth() + 1) +
    "-" +
    p(x.getDate()) +
    "T" +
    p(x.getHours()) +
    ":" +
    p(x.getMinutes())
  );
}
export const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);
