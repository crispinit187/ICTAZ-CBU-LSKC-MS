// Password rules from the SRS (AU-20). The same rules must be enforced by the server.
const COMMON = [
  "password",
  "password1",
  "password123",
  "12345678",
  "qwerty123",
  "letmein1",
  "welcome1",
  "admin123",
  "iloveyou1",
  "abc12345",
  "passw0rd1",
];

export function passwordChecks(
  pw,
  { studentNumber = "", email = "", previous = "" } = {},
) {
  const low = pw.toLowerCase();
  return [
    { id: "len", label: "At least 8 characters", ok: pw.length >= 8 },
    { id: "upper", label: "An upper-case letter", ok: /[A-Z]/.test(pw) },
    { id: "lower", label: "A lower-case letter", ok: /[a-z]/.test(pw) },
    { id: "digit", label: "A digit", ok: /\d/.test(pw) },
    {
      id: "differs",
      label: "Different from your student number, email and previous password",
      ok:
        pw.length > 0 &&
        pw !== studentNumber &&
        low !== email.toLowerCase() &&
        (!previous || pw !== previous),
    },
    {
      id: "common",
      label: "Not a common password",
      ok: pw.length > 0 && !COMMON.includes(low),
    },
  ];
}
