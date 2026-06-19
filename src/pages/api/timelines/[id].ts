import type { APIRoute } from "astro";
import { db } from "@db/db";
import { Timeline } from "@db/schema";
import { eq } from "drizzle-orm";

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;
  if (!id) return new Response("Bad Request", { status: 400 });

  try {
    const [timeline] = await db
      .select()
      .from(Timeline)
      .where(eq(Timeline.id, id))
      .limit(1);

    if (!timeline) return new Response("Not Found", { status: 404 });

    return new Response(JSON.stringify(timeline), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle server errors, e.g., database connection issues or network timeout
    console.error("Error fetching timeline from the server:", error);

    // Return a default response with status code 500 to indicate an internal server error
    return new Response("Internal Postgres DB Server Error", { status: 500 });
  }
};