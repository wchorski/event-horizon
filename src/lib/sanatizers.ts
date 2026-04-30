/**
 * removes keys with empty strings completely
 */
export function parseOutUndefinedFormData(
  data: Record<string, FormDataEntryValue>,
): Record<string, FormDataEntryValue> {
  return Object.fromEntries(
    Object.entries(data)
      .map(([k, v]) => [k, typeof v === "string" ? v.trim() : v] as const)
      .filter(([, v]) => v !== "" && v !== undefined),
  );
}

export interface SanitizationResult {
  valid: string[];
  invalid: string[];
}

export function removeHTMLfromString(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/[\r\n]+/g, ", ") // replace newlines with comma+space
    .replace(/\s{2,}/g, " ") // collapse extra spaces
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width chars
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}