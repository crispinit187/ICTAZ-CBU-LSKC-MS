// Program matching from SRS section 8.2. The real grouping runs on the server;
// this copy only powers suggestions and the hint on the form.
const FILLER = new Set([
  "of",
  "in",
  "the",
  "and",
  "programme",
  "program",
  "bachelor",
  "bachelors",
  "bsc",
  "beng",
  "btech",
  "diploma",
  "degree",
  "honours",
  "hons",
  "masters",
  "msc",
]);

let KNOWN_PROGRAMS = [
  { name: "Computer Engineering", count: 79 },
  { name: "Information Technology", count: 76 },
  { name: "Software Engineering", count: 74 },
  { name: "Cyber Security", count: 71 },
  { name: "Data Science", count: 66 },
  { name: "Electrical Engineering", count: 41 },
  { name: "Business Administration", count: 38 },
  { name: "Accounting and Finance", count: 30 },
];

// Replace the sample list with the real programmes from the database.
export function setPrograms(list) {
  if (Array.isArray(list) && list.length) KNOWN_PROGRAMS = list;
}

export function normalise(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !FILLER.has(w))
    .join(" ");
}

const compact = (s) => normalise(s).replace(/\s/g, "");

// edit distance where a swap of two neighbouring letters counts once
function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [
    i,
    ...Array(b.length).fill(0),
  ]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

const digits = (s) => (s.match(/\d+/g) || []).join(",");

function allowed(len) {
  if (len < 5) return 0;
  return len >= 9 ? 2 : 1;
}

export function findGroup(typed) {
  const t = compact(typed);
  if (!t) return null;
  return (
    KNOWN_PROGRAMS.find((p) => {
      const k = compact(p.name);
      return (
        digits(p.name) === digits(typed) && distance(t, k) <= allowed(k.length)
      );
    }) || null
  );
}

// starts-with, then contains, then close typo, then popularity
export function suggest(typed, limit = 5) {
  const raw = typed.trim().toLowerCase();
  const n = normalise(typed);
  if (!raw) return KNOWN_PROGRAMS.slice(0, limit);
  if (!n) return [];
  const t = n.replace(/\s/g, "");
  const tier = (p) => {
    const lower = p.name.toLowerCase();
    const nk = normalise(p.name);
    if (lower.startsWith(raw) || nk.startsWith(n)) return 0;
    if (lower.includes(raw) || nk.includes(n)) return 1;
    return distance(t, compact(p.name)) <= 2 && t.length >= 5 ? 2 : 3;
  };
  return KNOWN_PROGRAMS.map((p) => ({ p, t: tier(p) }))
    .filter((x) => x.t < 3)
    .sort((a, b) => a.t - b.t || b.p.count - a.p.count)
    .slice(0, limit)
    .map((x) => x.p);
}
