export function modifyHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function toDatetimeLocalValue(
  value: string | Date | null | undefined,
): string {
  if (!value) return "";
  const iso = typeof value === "string" ? value : value.toISOString();
  console.log({iso});
  return iso.slice(0, 16);
}

export function datetimeLocalValueToDate(value: string): Date {
  // value: "2027-12-31T14:50"
  return new Date(`${value}:00.000Z`);
}
