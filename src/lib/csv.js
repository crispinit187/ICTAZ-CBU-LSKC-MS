/* Builds a CSV file (with a byte-order mark so Excel reads it correctly) and downloads it. */
const cell = (v) => {
  if (v === null || v === undefined) return "";
  let s = String(v);
  // stop spreadsheet formulas from running
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

export function toCsv(rows, columns) {
  const head = columns.map((c) => cell(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => cell(r[c.key])).join(","));
  return [head, ...body].join("\r\n");
}

export function downloadCsv(name, rows, columns) {
  const blob = new Blob(["﻿" + toCsv(rows, columns)], {
    type: "text/csv;charset=utf-8",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
