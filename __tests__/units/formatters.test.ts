import { describe, it, expect } from "vitest";
import {
  formatPhonePrettyManual,
  slugify,
  localDateTimeToRealDate,
  normalizePhoneToE164Manual,
  prettyPlainCivilDateFull,
} from "@lib/formatters";
import { formatTimeMinutesToClockString, formatTimeToMinutes } from "@lib/timeFormatters";


describe("formatTimeToMinutes", () => {
  it("converts standard time to minutes", () => {
    expect(formatTimeToMinutes("13:45")).toBe(825);
  });
  it("converts midnight to 0", () => {
    expect(formatTimeToMinutes("00:00")).toBe(0);
  });
  it("converts end of day", () => {
    expect(formatTimeToMinutes("23:59")).toBe(1439);
  });
  it("converts top of hour", () => {
    expect(formatTimeToMinutes("09:00")).toBe(540);
  });
  it("converts half hour", () => {
    expect(formatTimeToMinutes("00:30")).toBe(30);
  });
});

describe("formatTimeMinutesToClockString", () => {
  it("converts minutes to 24h clock string", () => {
    expect(formatTimeMinutesToClockString(825, false)).toBe("13:45");
  });
  it("converts midnight (0) in 24h", () => {
    expect(formatTimeMinutesToClockString(0, false)).toBe("00:00");
  });
  it("converts to 12h format AM", () => {
    expect(formatTimeMinutesToClockString(540, true)).toBe("9:00 AM");
  });
  it("converts to 12h format PM", () => {
    expect(formatTimeMinutesToClockString(825, true)).toBe("1:45 PM");
  });
  it("wraps values over 1439 back to start of day", () => {
    expect(formatTimeMinutesToClockString(1440, false)).toBe("00:00"); // 1440 = next midnight
    expect(formatTimeMinutesToClockString(1500, false)).toBe("01:00"); // 1500 - 1440 = 60
  });
  it("converts end of day 23:59", () => {
    expect(formatTimeMinutesToClockString(1439, false)).toBe("23:59");
  });
});

describe("prettyPlainCivilDateFull", () => {
  it("formats a valid civil datetime correctly", () => {
    const result = prettyPlainCivilDateFull("2026-04-28T10:00");

    expect(result).toBe(
      "Tuesday, April 28, 2026 at 10:00 AM"
    );
  });

  it("pads minutes correctly", () => {
    const result = prettyPlainCivilDateFull("2026-04-28T10:05");

    expect(result).toBe(
      "Tuesday, April 28, 2026 at 10:05 AM"
    );
  });

  it("throws for invalid format (missing T)", () => {
    expect(() =>
      prettyPlainCivilDateFull("2026-04-28 10:00")
    ).toThrow("Invalid format");
  });

  it("throws for invalid format (seconds present)", () => {
    expect(() =>
      prettyPlainCivilDateFull("2026-04-28T10:00:00")
    ).toThrow("Invalid format");
  });

  it("throws for impossible calendar dates", () => {
    expect(() =>
      prettyPlainCivilDateFull("2026-02-30T10:00")
    ).toThrow("Invalid calendar date/time");
  });

  it("throws for invalid hour", () => {
    expect(() =>
      prettyPlainCivilDateFull("2026-04-28T25:00")
    ).toThrow("Invalid calendar date/time");
  });
});


describe("localDateTimeToRealDate", () => {
  it("converts a local datetime string to a Date in the given timezone", () => {
    const result = localDateTimeToRealDate(
      "2026-03-01T12:00:00",
      "America/New_York",
    );

    // 12:00 in NY (EST, UTC-5) = 17:00 UTC
    expect(result.toISOString()).toBe("2026-03-01T17:00:00.000Z");
  });

  it("handles different timezones correctly", () => {
    const ny = localDateTimeToRealDate(
      "2026-03-01T12:00:00",
      "America/New_York",
    );

    const la = localDateTimeToRealDate(
      "2026-03-01T12:00:00",
      "America/Los_Angeles",
    );

    expect(ny.getTime()).not.toBe(la.getTime());
  });

  it("handles daylight saving time (DST start)", () => {
    // DST starts in NY: 2026-03-08T02:00 → 03:00
    const result = localDateTimeToRealDate(
      "2026-03-08T03:00:00",
      "America/New_York",
    );

    expect(result.toISOString()).toBe("2026-03-08T07:00:00.000Z");
  });

  it("handles daylight saving time (DST end)", () => {
    // Ambiguous time (1:30 AM occurs twice)
    const result = localDateTimeToRealDate(
      "2026-11-01T01:30:00",
      "America/New_York",
    );

    // Temporal defaults to the earlier offset
    expect(result.toISOString()).toBe("2026-11-01T05:30:00.000Z");
  });

  it("works with UTC timezone", () => {
    const result = localDateTimeToRealDate("2026-03-01T12:00:00", "UTC");

    expect(result.toISOString()).toBe("2026-03-01T12:00:00.000Z");
  });

  it("throws on invalid datetime string", () => {
    expect(() => localDateTimeToRealDate("not-a-date", "UTC")).toThrow();
  });

  it("throws on invalid timezone", () => {
    expect(() =>
      localDateTimeToRealDate("2026-03-01T12:00:00", "Invalid/Timezone"),
    ).toThrow();
  });

  it("preserves milliseconds if provided", () => {
    const result = localDateTimeToRealDate("2026-03-01T12:00:00.123", "UTC");

    expect(result.getUTCMilliseconds()).toBe(123);
  });
});

// describe("formatPhonePrettyManual", () => {
//   describe("basic behavior", () => {
//     it("returns undefined for null/undefined input", () => {
//       expect(formatPhonePrettyManual(undefined)).toBeUndefined();
//       expect(formatPhonePrettyManual(null)).toBeUndefined();
//     });

//     it("throws on empty string", () => {
//       expect(() => formatPhonePrettyManual("")).toThrow();
//     });
//   });

//   describe("north american numbers", () => {
//     it("formats 10-digit number with default country code", () => {
//       const result = formatPhonePrettyManual("3125551234");
//       expect(result).toBe("+1 (312) 555-1234");
//     });

//     it("formats number with punctuation", () => {
//       const result = formatPhonePrettyManual("(312) 555-1234");
//       expect(result).toBe("+1 (312) 555-1234");
//     });

//     it("formats number with spaces and dashes", () => {
//       const result = formatPhonePrettyManual("312-555 1234");
//       expect(result).toBe("+1 (312) 555-1234");
//     });

//     it("handles leading 1 (11-digit NANP)", () => {
//       const result = formatPhonePrettyManual("13125551234");
//       expect(result).toBe("+1 (312) 555-1234");
//     });

//     it("handles explicit +1 country code", () => {
//       const result = formatPhonePrettyManual("+13125551234");
//       expect(result).toBe("+1 (312) 555-1234");
//     });
//   });

//   describe("international numbers", () => {
//     it("formats simple international number", () => {
//       const result = formatPhonePrettyManual("+442071838750");
//       expect(result).toBe("+44 2071838750");
//     });

//     it("formats longer international number", () => {
//       const result = formatPhonePrettyManual("+918527001234");
//       expect(result).toBe("+91 8527001234");
//     });

//     it("falls back to default country code when ambiguous", () => {
//       const result = formatPhonePrettyManual("+1234567890", {
//         defaultCountryCode: "1",
//       });

//       expect(result).toBe("+1 1234567890");
//     });
//   });

//   describe("custom default country code", () => {
//     it("uses custom default country code for 10-digit numbers", () => {
//       const result = formatPhonePrettyManual("2071838750", {
//         defaultCountryCode: "44",
//       });

//       expect(result).toBe("+44 2071838750");
//     });
//   });

//   describe("invalid inputs", () => {
//     it("throws when too short", () => {
//       expect(() => formatPhonePrettyManual("12345")).toThrow(
//         "Unable to parse phone number format",
//       );
//     });

//     it("throws when too long without +", () => {
//       expect(() => formatPhonePrettyManual("999999999999999")).toThrow(
//         "Unable to parse phone number format",
//       );
//     });

//     it("throws when non-digit input results in invalid length", () => {
//       expect(() => formatPhonePrettyManual("abc-def-ghij")).toThrow();
//     });
//   });

//   describe("edge cases", () => {
//     it("preserves leading zeros in national number", () => {
//       const result = formatPhonePrettyManual("+440012345678");
//       expect(result).toBe("+44 0012345678");
//     });

//     it("handles already clean formatted international input", () => {
//       const result = formatPhonePrettyManual("+44 2071838750");
//       expect(result).toBe("+44 2071838750");
//     });

//     it("handles mixed characters gracefully", () => {
//       const result = formatPhonePrettyManual("+1 (312) ABC-1234");
//       expect(result).toBe("+1 (312) 123-4"); // demonstrates current behavior
//     });
//   });
// });

describe("normalizePhoneToE164Manual", () => {
  describe("nullish input", () => {
    it("returns null for undefined", () => {
      expect(normalizePhoneToE164Manual(undefined)).toBeNull();
    });

    it("returns null for null", () => {
      expect(normalizePhoneToE164Manual(null as any)).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(normalizePhoneToE164Manual("")).toBeNull();
    });
  });

  describe("explicit international (+ prefix)", () => {
    it("accepts valid E.164 length (8–15 digits)", () => {
      expect(normalizePhoneToE164Manual("+442071838750")).toBe("+442071838750");
      expect(normalizePhoneToE164Manual("+918527001234")).toBe("+918527001234");
    });

    it("strips formatting but preserves +", () => {
      expect(normalizePhoneToE164Manual("+44 20 7183 8750")).toBe(
        "+442071838750",
      );
    });

    it("rejects too short numbers", () => {
      expect(normalizePhoneToE164Manual("+1234567")).toBeNull(); // 7 digits
    });

    it("rejects too long numbers", () => {
      expect(normalizePhoneToE164Manual("+1234567890123456")).toBeNull(); // 16 digits
    });
  });

  describe("north american numbers", () => {
    it("formats 10-digit number to +1", () => {
      expect(normalizePhoneToE164Manual("3125551234")).toBe("+13125551234");
    });

    it("handles punctuation", () => {
      expect(normalizePhoneToE164Manual("(312) 555-1234")).toBe("+13125551234");
    });

    it("handles spaces and mixed formatting", () => {
      expect(normalizePhoneToE164Manual("312-555 1234")).toBe("+13125551234");
    });
  });

  describe("numbers with country code but no +", () => {
    it("accepts 11–15 digit numbers as already including country code", () => {
      expect(normalizePhoneToE164Manual("13125551234")).toBe("+13125551234");

      expect(normalizePhoneToE164Manual("442071838750")).toBe("+442071838750");
    });
  });

  describe("custom default country code", () => {
    it("uses custom default for 10-digit numbers", () => {
      expect(
        normalizePhoneToE164Manual("2071838750", {
          defaultCountryCode: "44",
        }),
      ).toBe("+442071838750");
    });
  });

  describe("invalid inputs", () => {
    it("returns null for too few digits", () => {
      expect(normalizePhoneToE164Manual("12345")).toBeNull();
    });

    it("returns null for non-digit input", () => {
      expect(normalizePhoneToE164Manual("abcdefg")).toBeNull();
    });

    it("returns null for mixed input that results in invalid length", () => {
      expect(normalizePhoneToE164Manual("call me 123")).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("trims whitespace before checking +", () => {
      expect(normalizePhoneToE164Manual("   +442071838750")).toBe(
        "+442071838750",
      );
    });

    it("handles leading zeros in international numbers", () => {
      expect(normalizePhoneToE164Manual("+440012345678")).toBe("+440012345678");
    });

    it("does not modify already valid E.164", () => {
      const input = "+13125551234";
      expect(normalizePhoneToE164Manual(input)).toBe(input);
    });
  });
});

describe("slugify", () => {
  it("handles camelCase and uppercase sequences", () => {
    expect(slugify("helloWorld")).toBe("hello-world");
    expect(slugify("getURLPath")).toBe("get-url-path");
    expect(slugify("MixedCASEString")).toBe("mixed-case-string");
  });

  it("handles spaces, underscores, and mixed separators", () => {
    expect(slugify("My Test_function")).toBe("my-test-function");
    expect(slugify("multiple   spaces")).toBe("multiple-spaces");
    expect(slugify("__underscores__")).toBe("underscores");
  });

  it("removes special characters and normalizes accents", () => {
    expect(slugify("Hello!@#World")).toBe("hello-world");
    expect(slugify("Café Déjà Vu")).toBe("cafe-deja-vu");
  });

  it("trims leading/trailing whitespace and dashes", () => {
    expect(slugify("   Leading and trailing  ")).toBe("leading-and-trailing");
    expect(slugify("---surrounded---")).toBe("surrounded");
  });

  it("collapses consecutive dashes", () => {
    expect(slugify("Hello---World")).toBe("hello-world");
  });

  it("lowercases everything", () => {
    expect(slugify("MixedCASEString")).toBe("mixed-case-string");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
});

