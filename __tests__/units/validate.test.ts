import { expect, test, describe } from "vitest";
import { validate } from "@lib/validate"; // adjust path
import { seedData } from "@db/seed-data";

/**
 * Recursively normalizes seed objects for Zod validation:
 * - Converts null → undefined
 * - Converts boolean → "on" for truthy booleans
 */
export function normalizeForZod<T extends Record<string, any>>(obj: T): T {
  const newObj: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    const val = obj[key];

    if (val === null) {
      newObj[key] = undefined;
    } else if (typeof val === "boolean") {
      // convert any boolean to "on" if true, undefined if false
      newObj[key] = val ? "on" : undefined;
    } else if (typeof val === "object" && val !== null) {
      // recurse
      newObj[key] = normalizeForZod(val);
    } else {
      newObj[key] = val;
    }
  }

  return newObj;
}


describe("validate.user schema", () => {
  const validUser = normalizeForZod(seedData.users[0]);

  test("parses valid user and normalizes phone/email", () => {
    const result = validate.user.parse(validUser);
    expect(result.first_name).toBe(validUser.first_name);
    expect(result.last_name).toBe(validUser.last_name);
    expect(result.phone).toBe(validUser.phone); // normalized E.164
    expect(result.email).toBe(validUser.email?.toLowerCase());
  });

  test("fails on too short first_name", () => {
    const invalid = { ...validUser, first_name: "Al" };
    expect(() => validate.user.parse(invalid)).toThrow(
      /Must be more than 3 characters/,
    );
  });
});

describe("validate.ticket schema", () => {
  const validCredit = normalizeForZod(seedData.tickets[0]);

  test("parses valid ticket and transforms attended", () => {
    const result = validate.ticket.parse(validCredit);
    if (validCredit.attended) {
      expect(result.attended).toBe(true);
    }
  });

  test("attended defaults to false if not provided", () => {
    const ticket = { ...validCredit, attended: undefined };
    const result = validate.ticket.parse(ticket);
    expect(result.attended).toBe(false);
  });
});

describe("validate.course schema", () => {
  const validCourse = normalizeForZod(seedData.events[0]);

  test("parses valid course", () => {
    const result = validate.course.parse(validCourse);
    expect(result.subject).toBe(validCourse.subject);
    expect(result.date_civil).toBe(validCourse.date_civil);
  });

  test("fails missing required field", () => {
    const invalid = { ...validCourse, subject: "" };
    expect(() => validate.course.parse(invalid)).toThrow(
      /Must be more than 3 characters/,
    );
  });
});

describe("validate.location schema", () => {
  const validLocation = normalizeForZod(seedData.locations[0]);

  test("parses valid location", () => {
    const result = validate.location.parse(validLocation);
    expect(result.city).toBe(validLocation.city);
    expect(result.zip).toBe(validLocation.zip);
  });

  test("fails on invalid zip", () => {
    const invalid = { ...validLocation, zip: "bad input for zip" };
    expect(() => validate.location.parse(invalid)).toThrow(/Invalid ZIP code/);
  });
});

describe("validate.userLink schema", () => {
  const validLink = { user_id: seedData.users[0].id, event_id: seedData.events[0].id, attended: "on" };

  test("parses valid userLink and transforms attended", () => {
    const result = validate.userLink.parse(validLink);
    expect(result.attended).toBe(true);
  });

  test("fails missing required field", () => {
    const invalid = { ...validLink, event_id: undefined };
    expect(() => validate.userLink.parse(invalid)).toThrow();
  });
});
