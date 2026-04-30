// src/pages/api/confirm-ticket.ts
import type { APIRoute } from "astro";
import { db } from "@db/db";
import { User, Ticket, Event } from "@db/schema";
import { eq } from "drizzle-orm";
import { z } from "astro/zod";
import { normalizePhoneToE164Manual } from "@lib/formatters";

const formSchema = z.object({
  user_id: z.coerce.number().optional(),
  event_id: z.coerce.number(),
  asipId: z.coerce.number(),
  regNum: z.coerce.number(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  middle_initial: z.string().optional(),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  email: z.string().email("Invalid email address"),
  address_1: z.string().min(1, "Address is required"),
  address_2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  // state: z.enum(["Illinois", "Indiana", "Iowa"], {
  //   errorMap: () => ({ message: "Please select a valid state" })
  // }),
  state: z.string().min(1, "State is required"),
  zip: z.coerce.number().min(10000).max(99999, "Invalid ZIP code"),
});

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    // Validate
    const result = formSchema.safeParse(data);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const errorMessages = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${messages?.join(", ")}`)
        .join("; ");

      // Redirect to form partial with error
      return redirect(
        `/partials/ticket-form?error=${encodeURIComponent(errorMessages)}`,
      );
    }

    const {
      user_id,
      event_id,
      // asipId,
      // regNum,
      first_name,
      last_name,
      middle_initial,
      phone,
      email,
      address_1,
      address_2,
      city,
      state,
      zip,
    } = result.data;

    const courseExists = await db
      // TODO i could combine query for course + tickets here
      .select()
      .from(Event)
      .where(eq(Event.id, event_id))
      .limit(1);

    if (!courseExists) {
      return redirect(
        `/partials/ticket-form?error=${encodeURIComponent(`Event with ID ${event_id} does not exist`)}`,
      );
    }

    const courseCredits = await db
      .select()
      .from(Ticket)
      .where(eq(Ticket.event_id, event_id));

    const phoneSanatized: string | null = normalizePhoneToE164Manual(phone);
    if (!phoneSanatized) {
      return redirect(
        `/partials/ticket-form?error=${encodeURIComponent(`Fix phone formatting`)}`,
      );
    }

    const memberExists = user_id
      ? await db.select().from(User).where(eq(User.id, user_id)).limit(1)
      : await db
          .select()
          .from(User)
          .where(eq(User.phone, phoneSanatized))
          .limit(1);
    // TODO member may not exist yet (if this app doesn't also register them)
    // if (!memberExists) {
    //   return redirect(
    //     `/partials/ticket-form?error=${encodeURIComponent(`User with ID ${memberExists} does not exist`)}`,
    //   );
    // }

    // let newMember = null;

    // TODO validate inputs

    if (!memberExists) {
      const [newMember] = await db
        .insert(User)
        .values({
          // asipId,
          // regNum,
          first_name,
          last_name,
          middle_initial,
          phone,
          email,
          address_1: address_1,
          address_2: address_2,
          city,
          state,
          zip,
        })
        .returning();

      await db.insert(Ticket).values({
        user_id: newMember.id,
        courseId: event_id,
        timestamp: new Date(),
        attended: true,
      });
    } else {
      // member does exist
      const userCredit = courseCredits.find(
        (ticket) => ticket.userId === memberExists.id,
      );

      if (userCredit && userCredit.attended)
        return new Response(
          `
            User ${memberExists.id} ${memberExists.first_name}
            already attended: ${userCredit.attended}
          `,
          { status: 411 },
        );

      await db.insert(Ticket).values({
        user_id: memberExists.id,
        courseId: event_id,
        timestamp: new Date(),
        attended: true,
      });
    }

    // Redirect to form with success and trigger list update
    return redirect("/partials/ticket-form?success=Ticket+successfully+added");
  } catch (error) {
    console.error(error);
    return redirect("/partials/ticket-form?error=An+unexpected+error+occurred");
  }
};
