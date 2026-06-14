interface PrettyFormatOptions {
  defaultCountryCode?: string;
}
interface FormatPhoneOptions {
  defaultCountryCode?: string;
}

import { Temporal } from "@js-temporal/polyfill";

// export function formatPhoneToE164Manual(input?: string): string | null {
//   if (!input) return null;
//   let digitsOnly = input.replace(/\D/g, "");
//   if (input.startsWith("+") && digitsOnly.length === 11)
//     return "+" + digitsOnly;
//   if (digitsOnly.length === 10) return `+1${digitsOnly}`;
//   return null; // too short
// }

interface E164Options {
  defaultCountryCode?: string; // e.g. "1"
}

interface E164Options {
  defaultCountryCode?: string;
}

export function normalizePhoneToE164Manual(
  input?: string,
  options: E164Options = { defaultCountryCode: "1" },
): string | null {
  if (!input) return null;

  const { defaultCountryCode = "1" } = options;

  const trimmed = input.trim(); // ✅ FIX 1
  const digits = trimmed.replace(/\D/g, "");

  // ✅ FIX 2: use trimmed, not input
  if (trimmed.startsWith("+")) {
    if (digits.length >= 8 && digits.length <= 15) {
      return `+${digits}`;
    }
    return null;
  }

  // ✅ FIX 3: remove hardcoded "1" condition
  if (digits.length === 10) {
    return `+${defaultCountryCode}${digits}`;
  }

  if (digits.length > 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

export function slugify(text: string): string {
  return (
    text
      .normalize("NFD") // decompose accents
      .replace(/[\u0300-\u036f]/g, "") // remove diacritics
      .trim()
      // insert dash between lowercase/number and uppercase (handles camelCase)
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      // insert dash between consecutive uppercase letters followed by lowercase (e.g., "URLPath" -> "URL-Path")
      .replace(/([A-Z]+)([A-Z][a-z0-9])/g, "$1-$2")
      // replace spaces, underscores, and non-alphanumeric with dash
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-zA-Z0-9-]+/g, "-") // treat special characters as separators
      .replace(/-+/g, "-") // collapse multiple dashes
      .replace(/^-+/, "") // trim leading dash
      .replace(/-+$/, "") // trim trailing dash
      .toLowerCase()
  );
}

export function formatPhonePrettyManual(
  input: string | undefined | null,
  options: PrettyFormatOptions = { defaultCountryCode: "1" },
) {
  if (!input || input === "undefined" || input === "null") {
    return undefined;
  }

  const { defaultCountryCode = "1" } = options;

  // Remove all non-digit characters
  let digitsOnly = input.replace(/\D/g, "");

  // Extract country code
  let countryCode: string;
  let nationalNumber: string;

  if (input.startsWith("+")) {
    // Has explicit country code
    if (digitsOnly.startsWith("1") && digitsOnly.length === 11) {
      // North American number
      countryCode = "1";
      nationalNumber = digitsOnly.slice(1);
    } else if (digitsOnly.length > 10) {
      // International - try to extract country code (simplified logic)
      // This is a simplified version; real implementation would need country code lookup
      const possibleCountryCode = digitsOnly.slice(0, digitsOnly.length - 10);
      countryCode = possibleCountryCode;
      nationalNumber = digitsOnly.slice(possibleCountryCode.length);
    } else {
      countryCode = defaultCountryCode;
      nationalNumber = digitsOnly;
    }
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    // Likely North American with country code
    countryCode = "1";
    nationalNumber = digitsOnly.slice(1);
  } else if (digitsOnly.length === 10) {
    // No country code, use default
    countryCode = defaultCountryCode;
    nationalNumber = digitsOnly;
  } else {
    // Uncertain format
    throw new Error("Unable to parse phone number format");
  }

  // Format based on country code
  if (countryCode === "1" && nationalNumber.length === 10) {
    // North American format: +1 (123) 123-1234
    const areaCode = nationalNumber.slice(0, 3);
    const firstPart = nationalNumber.slice(3, 6);
    const secondPart = nationalNumber.slice(6, 10);
    return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}`;
  } else {
    // Generic international format: +CC XXXXXXXXXX
    return `+${countryCode} ${nationalNumber}`;
  }
}

export function localDateTimeToRealDate(localString: string, timezone: string) {
  const plain = Temporal.PlainDateTime.from(localString);

  const zoned = plain.toZonedDateTime(timezone);

  return new Date(zoned.epochMilliseconds);
}

const LOCAL_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_DATE_TIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function prettyPlainCivilDateFull(date_civil: string): string {
  try {
    // ✅ Date only
    if (LOCAL_DATE_REGEX.test(date_civil)) {
      const date = Temporal.PlainDate.from(date_civil);

      return date.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    // ✅ Date + time
    if (LOCAL_DATE_TIME_REGEX.test(date_civil)) {
      const dt = Temporal.PlainDateTime.from(date_civil);

      return dt.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }

    throw new Error();
  } catch {
    throw new Error(
      `Invalid format. Expected YYYY-MM-DD or YYYY-MM-DDTHH:mm, received: ${date_civil}`,
    );
  }
}

export function prettyDateToLocale(timestamp: Date) {
  return timestamp.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const dateToLocaleFieldValue = (timestamp: Date) => {
  return timestamp
    .toLocaleString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(", ", "T");
};

// Example usage:
/*
formatPhonePrettyManual('+11231231234'); // "+1 (123) 123-1234"
formatPhonePrettyManual('1231231234'); // "+1 (123) 123-1234"
formatPhonePrettyManual('(123) 123-1234'); // "+1 (123) 123-1234"
formatPhonePrettyManual('+11231231234'); // "+1 (123) 123-1234"
*/

/**
 * Convert an API date string (with offset) into a local datetime string
 * in the target IANA timezone, formatted as "YYYY-MM-DDTHH:mm".
 */
export function toLocalDateTimeString(
  apiDateString: string,
  timeZone: string,
): string {
  const date = new Date(apiDateString);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp: ${apiDateString}`);
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, // e.g. "America/Chicago"
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value;

  const y = get("year");
  const m = get("month");
  const d = get("day");
  const h = get("hour");
  const min = get("minute");

  if (!y || !m || !d || !h || !min) {
    throw new Error(`Failed to format date parts for ${timeZone}`);
  }

  return `${y}-${m}-${d}T${h}:${min}`;
}

// export function localDateTimeToRealDate(
//   date_civil: string,        // "2026-02-26T19:00"
//   timeZone: string          // "America/Chicago"
// ): Date {
//   // Parse components manually (do NOT let Date guess)
//   const [datePart, timePart] = dateCivil.split("T");
//   const [year, month, day] = datePart.split("-").map(Number);
//   const [hour, minute] = timePart.split(":").map(Number);

//   // Create a UTC date from the components
//   const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));

//   // Ask Intl what the offset is for this timezone at that moment
//   const formatter = new Intl.DateTimeFormat("en-US", {
//     timeZone,
//     hour12: false,
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//   });

//   const parts = formatter.formatToParts(utcDate);
//   const get = (t: string) => Number(parts.find(p => p.type === t)?.value);

//   const adjusted = Date.UTC(
//     get("year"),
//     get("month") - 1,
//     get("day"),
//     get("hour"),
//     get("minute"),
//     get("second")
//   );

//   return new Date(adjusted);
// }
