// src/lib/dayFolder.ts
const DAY_PATTERN = /^\d{2}-\d{2}$/;   // "09-14"
const YEAR_PATTERN = /^\d{4}$/;        // "2026"

export function isDayFolder(crumbs: { name: string }[]): boolean {
  if (crumbs.length < 2) return false;

  const current = crumbs[crumbs.length - 1];
  const parent = crumbs[crumbs.length - 2];

  if (!DAY_PATTERN.test(current.name)) return false;
  if (!YEAR_PATTERN.test(parent.name)) return false;

  // Optional: reject invalid calendar dates like 13-40
  const [month, day] = current.name.split("-").map(Number);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  return true;
}