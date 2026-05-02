import { z } from "astro/zod";
import { normalizePhoneToE164Manual } from "./formatters";
import { BOOKING_STATUSES } from "@db/schema";

export const validate = {
  id: z.string(),
  bookingStatus: z.enum(BOOKING_STATUSES),
  phone: z
    .string()
    .trim()
    .transform((val) => normalizePhoneToE164Manual(val))
    .refine((val) => val !== null, "Phone must be 10 digits or E.164 format"),

  // TODO i should prob use .strict() where i can as a lot of these data inputs usually contain all fields type
  user: z.object({
    id: z.string(),
    first_name: z.string().trim().min(3, "Must be more than 3 characters"),
    last_name: z.string().trim().min(3, "Must be more than 3 characters"),
    middle_initial: z
      .string()
      .trim()
      .max(1, "no more than one character")
      .optional(),
    phone: z
      .string()
      .trim()
      .transform((val) => normalizePhoneToE164Manual(val))
      .refine((val) => val !== null, "Phone must be 10 digits or E.164 format"),
    email: z.string().trim().toLowerCase().email("Invalid email address"),
    address_1: z.string().trim().min(3, "Must be more than 3 characters"),
    address_2: z.string().trim().toLowerCase().optional(),
    city: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "Must be more than 3 characters"),
    state: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "Must be more than 3 characters"),
    zip: z.string().min(5, "Invalid ZIP code").max(5, "Invalid ZIP code"),
  }),

  get userCreate() {
    return this.user.omit({ id: true });
  },

  get userUpdate() {
    return this.user;
  },

  ticket: z.object({
    id: z.string(),
    user_id: z.string(),
    event_id: z.string(),
    grade: z.string().optional(),
    // attended: z.coerce.boolean(),
    attended: z
      .string()
      .optional()
      .transform((v) => v === "on"),
  }),

  get creditCreate() {
    return this.ticket.omit({ id: true });
  },
  get creditUpdate() {
    return this.ticket;
  },

  //   MUTATIONS
  // get userCreditCreate() {
  //   return this.ticket.omit({ id: true });
  // },

  get userCreditUpdate() {
    return this.ticket.merge(this.user);
  },

  location: z.object({
    id: z.string(),
    name: z.string().min(3, "Must be more than 3 characters"),
    address: z.string().min(3, "Must be more than 3 characters"),
    city: z.string().min(3, "Must be more than 3 characters"),
    state: z.string().min(2, "Must be more than 3 characters"),
    zip: z.string().min(5, "Invalid ZIP code").max(5, "Invalid ZIP code"),
    timezone: z.string().min(8, "Must be more than 8 characters"),
    excerpt: z.string().optional(),
  }),

  get locationCreate() {
    return this.location.omit({ id: true });
  },
  get locationUpdate() {
    return this.location;
  },

  course: z.object({
    id: z.string(),
    wp_post_id: z.coerce.number().optional(),
    subject: z.string().min(3, "Must be more than 3 characters"),
    excerpt: z.string().optional(),
    // handles by crud
    // timestamp: z.date(),
    date_civil: z.string(),
    location_id: z.string(),
  }),

  get courseCreate() {
    return this.course.omit({ id: true });
  },
  get courseUpdate() {
    return this.course;
  },

  userLink: z
    .object({
      user_id: z.string(),
      event_id: z.string(),
      // attended: z.coerce.boolean(),
      attended: z
        .string()
        .optional()
        .transform((v) => v === "on"),
    })
    .strict(),

  userCreateAndLink: z
    .object({
      first_name: z.string().min(3),
      last_name: z.string().min(3),
      phone: z
        .string()
        .trim()
        .transform((val) => normalizePhoneToE164Manual(val))
        .refine(
          (val) => val !== null,
          "Phone must be 10 digits or E.164 format",
        ),
      email: z.string().trim().toLowerCase().email(),
      address_1: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      event_id: z.string(),
      // attended: z.coerce.boolean(),
      attended: z
        .string()
        .optional()
        .transform((v) => v === "on"),
    })
    .strict(),

  get userCreditCreate() {
    return z.any().superRefine((data, ctx) => {
      const isLinking = !!data.userId;
      const schema = isLinking ? validate.userLink : validate.userCreateAndLink;

      if (
        isLinking &&
        (data.first_name || data.last_name || data.email || data.phone)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "If linking by user_id, other fields must be left blank.",
        });
        return;
      }

      const result = schema.safeParse(data);

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue({
            code: "custom",
            message: issue.message,
            path: issue.path,
            params: {
              originalCode: issue.code,
            },
          });
        });
      }
    });
  },
};
