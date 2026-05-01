import type { WordpressEvent } from "@ty/WordpressEvent";
import type { APIRoute } from "astro";
import { db } from "@db/db";
import { Event, Location } from "@db/schema";

// import eventJson from "../../../../private/l150-events.json";
import { removeHTMLfromString } from "@lib/sanatizers";
import type { EventInsert } from "@ty/Schema";

const { WORDPRESS_ENDPOINT, WP_USERNAME, WP_APP_PASSWORD, SERVER_TIMEZONE } =
  import.meta.env;

export const GET: APIRoute = async ({ url }) => {
  // Pass-through the `after` param (default to a fallback)
  //   TODO remove if empty. api defaults to current datetime
  const after = url.searchParams.get("after");
  const upstream = new URL(`${WORDPRESS_ENDPOINT}/wp-json/wchorski/v1/events`);
  if (after) upstream.searchParams.set("after", after);

  let wpPosts: WordpressEvent[];

  console.log({ upstream });
  try {
    const res = await fetch(upstream, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString("base64")}`,
        Accept: "application/json",
        // "User-Agent":
        //   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        // "Accept-Language": "en-US,en;q=0.9",
        // Referer: "https://local150.org/",
      },
    });
    if (!res.ok) {
      const body = await res.text();
      console.log({ status: res.status, body });
      throw new Error(`Upstream error: ${res.status}`);
    }
    wpPosts = await res.json();
  } catch (err) {
    console.log("X api/events/import wordpress fetch");
    console.log({ err });
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
  // console.log("🐸 BYPASSING API FETCH BECAUSE CLOUDFLARE 403 ERROR");
  // events = eventJson;

  const seedCoursesFormat: EventInsert[] = [];

  try {
    // ✅ Fetch locations once
    const locations = await db.select().from(Location);

    for (const wpPost of wpPosts) {
      const loc = findLocationForEvent(wpPost.where, locations);
      if (!loc) {
        const detail = `❌ No matching location for event ${wpPost.id}: ${wpPost.where}`;
        console.log(detail);
        return new Response(
          JSON.stringify({ error: "DB write failed", detail }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // ✅ Canonical local time from real_event_date
      const date_civil = realEventDateToLocalString(wpPost.real_event_date);

      // ✅ Real Date (instant) derived from local+zone
      const realDate = localDateTimeToUtcDate(date_civil, loc.timezone);

      const newCourse: EventInsert = {
        // id: wpPost.id,
        wp_post_id: wpPost.id,
        subject: wpPost.title,
        excerpt: wpPost.event_description,
        timestamp: realDate,
        date_civil,
        where: removeHTMLfromString(wpPost.where),
        location_id: loc.id,
      };
      // @ts-ignore
      seedCoursesFormat.push({ ...newCourse, timestamp: realDate.toISOString() });

      await db.insert(Event).values(newCourse).onConflictDoUpdate({
        target: Event.id,
        set: newCourse,
      });
    }
  } catch (err) {
    console.log("X api/events/import save to db trycatch");
    console.log({ err });
    return new Response(
      JSON.stringify({ error: "DB write failed", detail: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  console.log({ seedCoursesFormat });

  return new Response(JSON.stringify({ ok: true, synced: wpPosts.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

function realEventDateToLocalString(real: string): string {
  // "20260207080000" -> "2026-02-07T08:00"
  if (!/^\d{14}$/.test(real)) {
    throw new Error(`Invalid real_event_timestamp: ${real}`);
  }
  const y = real.slice(0, 4);
  const mo = real.slice(4, 6);
  const d = real.slice(6, 8);
  const h = real.slice(8, 10);
  const mi = real.slice(10, 12);
  // const s = real.slice(12, 14); // ignore seconds if you don’t store them
  return `${y}-${mo}-${d}T${h}:${mi}`;
}

function parsedateCivil(date_civil: string) {
  const [datePart, timePart] = date_civil.split("T");
  if (!datePart || !timePart)
    throw new Error(`Invalid date_civil: ${date_civil}`);

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  return { year, month, day, hour, minute };
}

function getZonedParts(timestamp: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = dtf.formatToParts(timestamp);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function localDateTimeToUtcDate(date_civil: string, timeZone: string): Date {
  const desired = parsedateCivil(date_civil);

  // First guess: treat desired local time as if it were UTC
  let guess = new Date(
    Date.UTC(
      desired.year,
      desired.month - 1,
      desired.day,
      desired.hour,
      desired.minute,
      0,
    ),
  );

  // See what local time that guess maps to in the zone
  let zoned = getZonedParts(guess, timeZone);

  // Compute difference in minutes between desired local and zoned local
  const desiredMinutes =
    Date.UTC(
      desired.year,
      desired.month - 1,
      desired.day,
      desired.hour,
      desired.minute,
    ) / 60000;
  const zonedMinutes =
    Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute) /
    60000;

  const deltaMinutes = desiredMinutes - zonedMinutes;
  guess = new Date(guess.getTime() + deltaMinutes * 60_000);

  // Second pass (handles DST edge cases better)
  zoned = getZonedParts(guess, timeZone);
  const zonedMinutes2 =
    Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute) /
    60000;
  const deltaMinutes2 = desiredMinutes - zonedMinutes2;

  return new Date(guess.getTime() + deltaMinutes2 * 60_000);
}

function findLocationForEvent(
  whereHtml: string,
  locations: Array<{ id: number; name: string; timezone: string }>,
) {
  const whereText = removeHTMLfromString(whereHtml);

  const match = locations.find((loc) =>
    whereText.includes(loc.name.toLowerCase()),
  );
  return match ?? null;
}
// ```

// Usage:
// ```
// GET /api/sync-events?after=2024-06-01T00:00:00
