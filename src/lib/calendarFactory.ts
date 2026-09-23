import type {
  Event,
  Attendee,
  DateTimeTimeZone,
  ItemBody,
  Location,
} from "@microsoft/microsoft-graph-types";

interface CalendarEventDraft {
  subject: string;
  body: ItemBody;
  start: DateTimeTimeZone;
  end: DateTimeTimeZone;
  location: Location;
  attendees: Attendee[];
  transactionId: string;
}

export function createCalendarDraft(
  overrides: Partial<CalendarEventDraft> = {},
  timeZone: string = "Central Standard Time",
): CalendarEventDraft {
  return {
    subject: "Default Board Meeting",
    body: {
      contentType: "html",
      content: "<p>TEST TEST TEST Monthly board review</p>",
    },
    start: {
      dateTime: "2026-09-27T09:00:00",
      timeZone,
    },
    end: {
      dateTime: "2026-09-27T11:00:00",
      timeZone,
    },
    location: {
      displayName: "TEST TEST TEST Conference Room TEST",
    },
    attendees: [
      {
        emailAddress: { address: "av@moeits.com", name: "MOEITS AV" },
        type: "required",
      },
    ],
    transactionId: crypto.randomUUID(),
    ...overrides,
  };
}

/**
 * Resolves the IANA/Windows time zone name that should be used for a meeting.
 *
 * TODO(locations-schema): once `Locations` exists, look up the room's stored
 * timeZone by `locationId` instead of returning the hardcoded default. Every
 * call site below already threads a `locationId` through, so wiring in the
 * DB lookup here is the only change needed — nothing else in the app should
 * need to change.
 *
 * Example of what this becomes later:
 *   if (locationId) {
 *     const location = await db.query.Locations.findFirst({
 *       where: eq(Locations.id, locationId),
 *     });
 *     if (location?.timeZone) return location.timeZone;
 *   }
 */
export async function resolveMeetingTimeZone(
  locationId?: string | null,
): Promise<string> {
  return "Central Standard Time";
}

/** Builds the Graph "Prefer" header so requests/responses use a consistent zone. */
export function outlookTimeZoneHeader(
  timeZone: string,
): Record<string, string> {
  return { Prefer: `outlook.timezone="${timeZone}"` };
}
