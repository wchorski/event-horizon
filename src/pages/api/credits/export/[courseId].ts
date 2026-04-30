// /api/tickets/export/:id
import { getMsToken } from "@lib/auth/msAuthentication";
import { formatPhonePrettyManual } from "@lib/formatters";
import type { CreditInsert, UserInsert } from "@ty/Schema.d.ts";
import type { APIRoute } from "astro";
import { db } from "@db/db";
import { Event, Ticket, User } from "@db/schema";
import { eq } from "drizzle-orm";
const {
  MS_SHAREPOINT_KYU_DRIVE_ID,
  MS_SHAREPOINT_KYU_ATTENDENCE_FOLDER_ID,
  MS_TOKEN_SITE_UPLOAD,
  TENANT_ID,
  MS_SITES_READWRITE_ALL_APP_ID,
  MS_SITES_READWRITE_ALL_SECRET_VALUE,
} = import.meta.env;

export const PUT: APIRoute = async ({ params, request, redirect }) => {
  const { event_id } = params;

  if (!event_id)
    return new Response(
      JSON.stringify({
        error: true,
        message: "midding course ID",
      }),
      { status: 422 },
    );

  try {
    if (!MS_TOKEN_SITE_UPLOAD) throw new Error("Missing TOKEN env var");

    // 1️⃣ Fetch the flattened rows
    const rows = await db
      .select({
        user: User,
        course: Event,
        ticket: Ticket,
      })
      .from(Event)
      .innerJoin(Ticket, eq(Ticket.event_id, Event.id))
      .innerJoin(User, eq(User.id, Ticket.user_id))
      .where(eq(Event.id, Number(event_id)));

    // reformat
    const courseData = {
      course: rows.length > 0 ? rows[0].course : null,

      tickets: rows.map((row) => {
        const {
          id: creditId,
          timestamp: creditDate,
          ...creditRest
        } = row.ticket; // pull id out, keep everything else
        const { id: user_id, ...memberRest } = row.user;
        return {
          user: {
            ...memberRest,
            user_id,
            phone: formatPhonePrettyManual(row.user.phone) || "",
          },
          ...creditRest,
          creditId,
          dateCreated: creditDate,
        };
      }),
    };

    if (!courseData.course)
      return new Response(
        JSON.stringify({
          error: true,
          message: "missing courseData",
        }),
        { status: 404 },
      );

    const csvContent = generateCreditsCsv(courseData.tickets);
    // const csvBuffer = Buffer.from(csvContent, "utf-8");
    // const stat = await fs.stat(csvBuffer);

    const filename = `${courseData.course.subject} - ${new Date(
      courseData.course.timestamp,
    ).toLocaleDateString("en-CA")} Tickets.csv`;
    const folderYear = new Date(courseData.course.timestamp).toLocaleDateString(
      "en-CA",
      { year: "numeric" },
    );

    // PUT /drives/{drive-id}/items/{parent-id}:/{filename}:/content  (upload new file) [1](https://learn.microsoft.com/en-us/graph/api/driveitem-put-content?view=graph-rest-1.0)
    const url = `https://graph.microsoft.com/v1.0/drives/${MS_SHAREPOINT_KYU_DRIVE_ID}/items/${MS_SHAREPOINT_KYU_ATTENDENCE_FOLDER_ID}:/${folderYear}/${encodeURIComponent(filename)}:/content`;

    const accessToken = await getMsToken(
      TENANT_ID,
      MS_SITES_READWRITE_ALL_APP_ID,
      MS_SITES_READWRITE_ALL_SECRET_VALUE,
    );

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // Authorization: `Bearer ${MS_TOKEN_SITE_UPLOAD}`,
        "Content-Type": "application/octet-stream",
        // "Content-Length": String(stat.size), // helps some proxies; optional but nice
      },
      body: csvContent,
      // Node fetch requires this when sending a stream body (duplex)
      // duplex: "half",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Upload failed: ${res.status} ${res.statusText}\n${text}`,
      );
    }

    const driveItem = await res.json();

    const isHtmx = request.headers.get("HX-Request") === "true";

    if (isHtmx) {
      return new Response(`<button disabled>Export Complete ✓</button>`, {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "csv exported and uploaded to sharepoint",
        data: {
          id: driveItem.id,
          name: driveItem.name,
          webUrl: driveItem.webUrl,
        },
      }),
      { status: 200 },
    );
    // return new Response(
    //   JSON.stringify({
    //     success: true,
    //     message: "csv exported and uploaded to sharepoint",
    //     data: csvContent,
    //   }),
    //   { status: 200 },
    // );
  } catch (error) {
    console.log(error);
    return new Response(
      JSON.stringify({
        error: true,
        message: "uh-oh",
      }),
      { status: 500 },
    );
  }
};

// type CreditWithMember = typeof Ticket.$inferInsert & {
//   user: typeof User.$inferInsert;
// };

type CreditWithMember = Omit<CreditInsert, "id" | "date"> & {
  creditId: CreditInsert["id"];
  dateCreated: CreditInsert["timestamp"];
  user: Omit<UserInsert, "id"> & {
    user_id: UserInsert["id"];
    phone: string; // because you force "" as fallback
  };
};

/**
 * Generate CSV from tickets array, automatically extracting headers
 * including nested 'member' object keys.
 */
export function generateCreditsCsv(tickets: CreditWithMember[]): string {
  if (!tickets.length) return "";

  // Flatten a single ticket into a flat object with nested member keys prefixed
  function flattenCredit(ticket: CreditWithMember) {
    const flat: Record<string, any> = {};

    // TODO format as much as you can in the `courseData` first. Do i need the member if statement check?
    for (const key in ticket) {
      if (key === "member" && ticket.user) {
        for (const mKey in ticket.user) {
          const typedKey = mKey as keyof typeof ticket.user;
          flat[mKey] = ticket.user[typedKey];
        }
      } else {
        const typedKey = key as keyof CreditWithMember;

        flat[key] = ticket[typedKey];
      }
    }
    return flat;
  }

  const flatCredits = tickets.map(flattenCredit);
  const headers = Object.keys(flatCredits[0]);

  function escapeCsv(value: any) {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  // Build CSV
  const csv = [
    headers.map(escapeCsv).join(","), // header row
    ...flatCredits.map((row: any) =>
      headers.map((h) => escapeCsv(row[h])).join(","),
    ), // data rows
  ].join("\n");

  return csv;
}

// const token = process.env.TOKEN; // must include Sites.ReadWrite.All (delegated) or app perms
// if (!token) throw new Error("Missing TOKEN env var");

// const driveId =
//   "b!kJWL9jV2pk6Q0OIXjyztdEUqPALStPhOs-phkM2mrOY8_wcvct4WQ4vtGwd23XE8";
// const parentId = "01Z2ED2WWEYSSUEVQRXFHYJPGOBTTZAATU";
// const localFilePath =
//   "/Volumes/Macintosh HD/Users/wchorski/Downloads/testfile.jpg";
// const fileName = "mynewfile.jpg";

// // Safer than b! in shells; not required in JS, but fine to keep consistent:
// const encodedDriveId = driveId.replace("!", "%21");

// // PUT /drives/{drive-id}/items/{parent-id}:/{filename}:/content  (upload new file) [1](https://learn.microsoft.com/en-us/graph/api/driveitem-put-content?view=graph-rest-1.0)
// const url = `https://graph.microsoft.com/v1.0/drives/${encodedDriveId}/items/${parentId}:/${encodeURIComponent(fileName)}:/content`;

// const stat = fs.stat(localFilePath);
// const stream = fs.readFile(localFilePath);

// const res = await fetch(url, {
//   method: "PUT",
//   headers: {
//     Authorization: `Bearer ${token}`,
//     "Content-Type": "application/octet-stream",
//     "Content-Length": String(stat.size), // helps some proxies; optional but nice
//   },
//   body: stream,
//   // Node fetch requires this when sending a stream body (duplex)
//   duplex: "half",
// });

// if (!res.ok) {
//   const text = await res.text();
//   throw new Error(`Upload failed: ${res.status} ${res.statusText}\n${text}`);
// }

// const driveItem = await res.json();
// console.log("Uploaded:", {
//   id: driveItem.id,
//   name: driveItem.name,
//   webUrl: driveItem.webUrl,
// });
