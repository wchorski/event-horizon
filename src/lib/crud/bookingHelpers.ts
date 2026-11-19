// lib/bookingsHelpers.ts

import { db } from "@db/db";
import { Booking, BookingClient, Location, User } from "@db/schema";
import { BadRequestError, NotFoundError } from "@lib/errors";
import { or, inArray } from "drizzle-orm";

export async function resolveLocation(
  locationId: string | null,
  location?: /* your location insert type */ any,
): Promise<string | undefined> {
  if (locationId) return locationId;
  if (!location) return undefined;

  const [created] = await db
    .insert(Location)
    .values(location)
    .returning({ id: Location.id });

  return created?.id;
}

const MAX_CLIENTS = 10;

type ClientSources = {
  emails?: string[];      // already validated by zod
  user_ids?: string[];    // from the combobox
};

export type ResolvedClient = { email: string; user_id: string | null };

export async function resolveClientLinks({
  emails = [],
  user_ids = [],
}: ClientSources): Promise<ResolvedClient[]> {
  const normalized = [...new Set(emails.map((e) => e.trim().toLowerCase()))];
  const ids = [...new Set(user_ids)];

  if (!normalized.length && !ids.length) return [];

  // one query covers both sources
  const found = await db
    .select({
      id: User.id,
      email: User.email,
      emailVerified: User.emailVerified,
      banned: User.banned,
    })
    .from(User)
    .where(
      or(
        normalized.length ? inArray(User.email, normalized) : undefined,
        ids.length ? inArray(User.id, ids) : undefined,
      ),
    );

  // every picked id must exist
  const foundIds = new Set(found.map((u) => u.id));
  if (ids.some((id) => !foundIds.has(id))) {
    throw new BadRequestError("Selected user was not found");
  }

  // only verified, non-banned accounts get linked
  const linkable = (u: (typeof found)[number]) => u.emailVerified && !u.banned;
  const byEmail = new Map(found.map((u) => [u.email.toLowerCase(), u]));

  // the Map dedupes: a picked user whose email was also typed collapses to one entry
  const result = new Map<string, ResolvedClient>();

  for (const email of normalized) {
    const u = byEmail.get(email);
    result.set(email, { email, user_id: u && linkable(u) ? u.id : null });
  }

  for (const id of ids) {
    const u = found.find((x) => x.id === id)!;
    const email = u.email.trim().toLowerCase();
    result.set(email, { email, user_id: linkable(u) ? u.id : null });
  }

  if (result.size > MAX_CLIENTS) {
    throw new BadRequestError(`You can invite up to ${MAX_CLIENTS} clients`);
  }

  return [...result.values()];
}

type ClientInput = { email: string; user_id: string | null };

type CreateBookingInput = {
  location_id: string | null;
  location?: Omit<typeof Location.$inferInsert, "author_user_id">;
  clients?: ClientInput[];
  authorUserId: string;
  client_id?: string;
  start: Date;
  end: Date;
  notes?: string;
};

export async function createBooking(input: CreateBookingInput) {
  return db.transaction(async (tx) => {
    // 1. location
    const location_id =
      input.location_id ??
      (input.location
        ? (
            await tx
              .insert(Location)
              .values({
                ...input.location,
                authorUserId: input.author_user_id,
              })
              .returning({ id: Location.id })
          )[0]?.id
        : undefined);

    // 2. booking
    const [booking] = await tx
      .insert(Booking)
      .values({
        start: input.start,
        end: input.end,
        notes: input.notes,
        status: "REQUESTED",
        authorUserId: input.author_user_id,
        location_id,
      })
      .returning();

    if (!booking) throw new NotFoundError("Booking not created");

    // 3 clients (after the booking exists), deduped by normalized email
    if (input.clients?.length) {
      await tx
        .insert(BookingClient)
        .values(
          input.clients.map((c) => ({
            booking_id: booking.id,
            email: c.email,
            user_id: c.user_id,
            claimed_at: c.user_id ? new Date() : null,
          })),
        )
        .onConflictDoNothing();
    }

    return booking;
  });
}
