// src/pages/api/timelines/[id].ts
import type { APIRoute } from "astro";
import { db } from "@db/db";
import { Timeline } from "@db/schema";
import { eq } from "drizzle-orm";

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;
  if (!id) return new Response("Bad Request", { status: 400 });

  const [timeline] = await db
    .select()
    .from(Timeline)
    .where(eq(Timeline.id, id))
    .limit(1);

  if (!timeline) return new Response("Not Found", { status: 404 });

  return new Response(JSON.stringify(timeline), {
    headers: { "Content-Type": "application/json" },
  });
};
