// full event data shape
// {
// "id": 55098,
// "title": "COMET 1 and Labor Studies",
// "date": "2025-11-07T01:00:29+00:00",
// "slug": "comet-1-and-labor-studies-2026",
// "link": "https://local150.org/events/comet-1-and-labor-studies-2026/",
// "event_date": "Saturday, February 7, 2026 8:00 am",
// "real_event_date": "20260207080000",
// "location": null,
// "where": "Local 150 District 1 Hall\u003Cbr /\u003E\r\n6200 Joliet Road\u003Cbr /\u003E\r\nCountryside IL 60525",
// "excerpt": null,
// "event_description": "Space is limited. Please contact (708) 390-8160 to R.S.V.P.",
// "_ame_cpe_post_policy": "{\"accessProtection\":{\"active\":\"replace\"}}"
// }

import type { EventInsert } from "@ty/Schema";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "./errors";

const { WP_USERNAME, WP_APP_PASSWORD, WORDPRESS_ENDPOINT } = import.meta.env;

function basicAuth(username: string, appPassword: string) {
  // WordPress app passwords often contain spaces for readability; remove them.
  const clean = appPassword.replace(/\s+/g, "");
  const token = Buffer.from(`${username}:${clean}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

/**
 * Convert "YYYY-MM-DDTHH:MM" + IANA time zone -> "YYYY-MM-DD HH:mm:ss"
 * This matches ACF date_time_picker REST schema expectations.
 */
function acfDateTimeFromCivil(date_civil: string) {
  // Force seconds, then replace "T" with space
  return dateCivil.replace("T", " ") + ":00";
}

// function acfRealDateTimeFromInstant(timestamp: Date, timeZone: string) {
//   const instant = Temporal.Instant.fromEpochMilliseconds(date.getTime());
//   const zdt = instant.toZonedDateTimeISO(timeZone);
//   return zdt
//     .toPlainDateTime()
//     .toString({ smallestUnit: "second" })
//     .replace("T", " ");
// }

export async function createWordpressEventPost(
  course: EventInsert,
  //   timezone: string,
) {
  if (!WP_USERNAME || !WP_APP_PASSWORD)
    throw new Error("missing WP app namd and or password");

  const authHeader = basicAuth(WP_USERNAME, WP_APP_PASSWORD);

  const acfDate = acfDateTimeFromCivil(course.date_civil);
  //   const acfRealDate = acfRealDateTimeFromInstant(course.date, timezone);

  // (Optional) sanity check: compare the instant-based version
  // const acfDateFromInstant = acfDateTimeFromInstant(course.date, timeZone);

  const payload = {
    title: course.subject,
    status: "draft",
    // if you want the WP post publish date, you can set "date" too, but it's optional
    // timestamp: new Date().toISOString(),
    content: course.excerpt ?? "",

    // Taxonomy term IDs (from your earlier examples)
    site: getSiteMap(course),
    event_filter: getEventFilterMap(course),

    // ACF fields — MUST match your ACF field "name" values
    acf: {
      event_timestamp: acfDate,
      // TODO use acfRealDateTimeFromInstant() to set relative to location's timezone (for now, the WP site doesn't even use or need this so setting both as the same is ok)
      real_event_timestamp: acfDate, // yes, both are required by your schema
      where: course.where ?? null,
      event_description: course.excerpt ?? null,
      show_link: "no", // enum: "no" | "yes"
      // optional fields from your group:
      when: null,
      extra: null,
      event_date_filter: null,
    },
  };

  try {
    const res = await fetch(`${WORDPRESS_ENDPOINT}/wp-json/wp/v2/event`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    // helpful error output
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`WP error ${res.status}: ${text}`);
    }

    const post = JSON.parse(text);
    // console.log("Created event:", { post });
    return post.id;

    //     curl -i -X POST "https://local150.org/wp-json/wp/v2/event" \
    //   -H "Authorization: Basic $AUTH" \
    //   -H "Content-Type: application/json" \
    //   -d '{
    //     "title": "TEST District Meeting",
    //     "status": "draft",
    //     "acf": {
    //       "event_date": "Friday, March 27, 2026 7:00 pm",
    //       "real_event_date": "20260327190000",
    //       "where": "District 9 Hall\n6200 Joliet Road, Countryside, IL",
    //       "event_description": "A valid union card is required for entry."
    //     },
    // "site": [181],
    // "event_filter": [194]
    //   }'
  } catch (e) {
    console.log(e);
    //? what a WP error looks like
    // {
    //   "code": "rest_not_logged_in",
    //   "message": "You are not currently logged in.",
    //   "data": { "status": 401 }
    // }
    if (e?.data.status === 401) throw new UnauthorizedError("wp unathorized");
    if (e?.data.status === 403) throw new ForbiddenError("wp ForbiddenError");
    if (e?.data.status === 404) throw new NotFoundError("wp NotFoundError");
    if (e?.data.status === 409) throw new ConflictError("wp ConflictError");
    if (e?.data.status === 422) throw new ValidationError(e.flatten());
    if (e?.data.status === 500) throw new Error(e.flatten());

    throw e;
  }
}

export async function updateWordpressEventPost(
  //   eventId: number,
  course: EventInsert,
  //   timezone: string,
) {
  if (!WP_USERNAME || !WP_APP_PASSWORD) {
    throw new Error("Missing WP_USERNAME and/or WP_APP_PASSWORD");
  }
  const acfDate = acfDateTimeFromCivil(course.date_civil);

  const payload = {
    title: course.subject,
    content: course.excerpt ?? "",
    site: getSiteMap(course),
    event_filter: getEventFilterMap(course),
    acf: {
      event_timestamp: acfDate, // must be "Y-m-d H:i:s"
      real_event_timestamp: acfDate, // must be "Y-m-d H:i:s"
      where: course.where ?? null,
      event_description: course.excerpt ?? null,
      show_link: "no",
    },
  };

  try {
    const res = await fetch(
      `https://local150.org/wp-json/wp/v2/event/${course.wpPostId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: basicAuth(WP_USERNAME, WP_APP_PASSWORD),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`WP error ${res.status}: ${text}`);
    }

    const post = JSON.parse(text);
    //   console.log("UPDATED event, ", { post });
    return post;
  } catch (e) {
    console.log(e);
    //? what a WP error looks like
    // {
    //   "code": "rest_not_logged_in",
    //   "message": "You are not currently logged in.",
    //   "data": { "status": 401 }
    // }
    if (e?.data.status === 401) throw new UnauthorizedError("wp unathorized");
    if (e?.data.status === 403) throw new ForbiddenError("wp ForbiddenError");
    if (e?.data.status === 404) throw new NotFoundError("wp NotFoundError");
    if (e?.data.status === 409) throw new ConflictError("wp ConflictError");
    if (e?.data.status === 422) throw new ValidationError(e.flatten());
    if (e?.data.status === 500) throw new Error(e.flatten());

    throw e;
  }
}

// TODO hardcoding for now to get MVP prototype. need to save id to Event.siteId
function getSiteMap(course: EventInsert) {
  const { locationId } = course;
  const ids = [];
  switch (true) {
    case locationId === 100:
    case locationId === 200:
    case locationId === 300:
    case locationId === 400:
    case locationId === 500:
    case locationId === 600:
    case locationId === 700:
    case locationId === 800:
      ids.push(181);
      break;
  }

  return ids;
}

// TODO learn how to move from hardcode
function getEventFilterMap(course: EventInsert) {
  const { locationId, subject } = course;
  const ids = [];
  switch (true) {
    // case locationId >= 0 && locationId <= 99:
    //   ids.push(0);
    case locationId >= 100 && locationId <= 199:
      ids.push(194);
      break;
    case locationId >= 200 && locationId <= 299:
      ids.push(195);
      break;
    case locationId >= 300 && locationId <= 399:
      ids.push(196);
      break;
    case locationId >= 400 && locationId <= 499:
      ids.push(197);
      break;
    case locationId >= 500 && locationId <= 599:
      ids.push(198);
      break;
    case locationId >= 600 && locationId <= 699:
      ids.push(199);
      break;
    case locationId >= 700 && locationId <= 799:
      ids.push(200);
      break;
    case locationId >= 800 && locationId <= 899:
      ids.push(201);
      break;
  }

  switch (true) {
    // "Education" filter
    case subject.toLowerCase().includes("know your union"):
    case subject.toLowerCase().includes("comet"):
      ids.push(202);
      break;
  }

  return ids;
}

// TODO pull filters from site and build
// async function fetchEventFilterTerms(authHeader: string) {
//   const res = await fetch("https://local150.org/wp-json/wp/v2/event_filter?per_page=100", {
//     headers: { Authorization: authHeader, Accept: "application/json" },
//   });
//   if (!res.ok) throw new Error(`Failed to fetch event_filter terms: ${res.status}`);
//   return res.json() as Promise<Array<{ id: number; slug: string; name: string }>>;
// }

// function buildDistrictTermMap(terms: Array<{ id: number; slug: string }>) {
//   const map: Record<number, number> = {};
//   for (const t of terms) {
//     const m = t.slug.match(/^district-(\d+)$/);
//     if (m) map[Number(m[1])] = t.id;
//   }
//   return map;
// }

// function buildSpecialTermMap(terms: Array<{ id: number; slug: string }>) {
//   const bySlug: Record<string, number> = {};
//   for (const t of terms) bySlug[t.slug] = t.id;
//   return bySlug; // e.g. bySlug["education"] -> 202
// }

//? USE CASE
// const terms = await fetchEventFilterTerms(authHeader);
// const districtMap = buildDistrictTermMap(terms);
// const specialMap = buildSpecialTermMap(terms);

// const districtId = 6;
// const eventFilterIds = [districtMap[districtId]];

// if (course.subject.includes("COMET") || course.subject.includes("Know Your Union")) {
//   eventFilterIds.push(specialMap["education"]);
// }
