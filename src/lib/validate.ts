import { z } from "astro/zod";
import { normalizePhoneToE164Manual, slugify } from "./formatters";
import { BOOKING_STATUSES } from "@db/schema";

const datetimeLocalToDate = z
  .string()
  .min(1, "Required")
  .transform((val, ctx) => {
    // val looks like "2027-12-31T14:50" (datetime-local input format)
    const withSeconds = val.length === 16 ? `${val}:00` : val; // handle missing seconds
    const date = new Date(`${withSeconds}.000Z`);

    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid date/time",
      });
      return z.NEVER;
    }

    return date;
  });

const uuidv7OptionalNull = z.preprocess((val) => {
  if (val === "") return null;
  return val;
}, z.uuidv7().nullable());

const bookingValidation = z.object({
  id: z.uuidv7(),
  // Don't reach for z.coerce.date() here — it runs values through new Date(value) directly
  start: datetimeLocalToDate,
  end: datetimeLocalToDate,
  notes: z.string(),
  status: z.enum(BOOKING_STATUSES),
  location_id: uuidv7OptionalNull,
  client_id: uuidv7OptionalNull,
  author_user_id: z.uuidv7(),
  // event_id: z.string(),
});

const withEndAfterStart = <T extends z.ZodTypeAny>(schema: T) =>
  schema.refine((data: any) => data.end >= data.start, {
    message: "END time must be older than or equal to START time",
    // path: [],
  });

export const slugSchema = z
  .string()
  .transform(slugify)
  .pipe(
    z
      .string()
      .min(1, "Slug cannot be empty")
      .max(200, "Slug too long")
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Invalid slug format"),
  );

export const validate = {
  // TODO validate as a uuidv7 when i fix seed data?
  // id: z.uuid(),
  datetimeLocalToDate,
  id: z.uuidv7(),
  bookingStatus: z.enum(BOOKING_STATUSES),
  phoneOptional: z.preprocess(
    (val) => (val === "" || val == null ? undefined : val),
    z
      .string()
      .trim()
      .transform((val) => normalizePhoneToE164Manual(val))
      .refine((val) => val !== null, "Phone must be 10 digits or E.164 format")
      .optional(),
  ),
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
    author_user_id: z.uuidv7(),
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

  booking: withEndAfterStart(bookingValidation),

  get bookingCreate() {
    return withEndAfterStart(bookingValidation.omit({ id: true }));
  },
  get bookingUpdate() {
    return withEndAfterStart(bookingValidation);
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

  organization: z.object({
    id: z.uuidv7(),
    name: z.string().min(3),
    slug: slugSchema,
    color: z.string().min(3).optional(),
    color_2: z.string().min(3).optional(),
    dedicated_db_url: z.string().optional(),
    logo: z.string().optional(),
    // dedicated_db_url: z.url().optional(),
    // logo: z.url().optional(),
  }),

  get organizationCreate() {
    return this.organization.omit({ id: true });
  },
  get organizationUpdate() {
    return this.organization;
  },
};

const uuidv7OrNullFromForm = z.preprocess((val) => {
  if (val === "" || val === undefined) return null;
  return val;
}, z.uuidv7().nullable());

const optionalLocation = z.preprocess(
  (val) => {
    if (
      typeof val === "object" &&
      val !== null &&
      Object.values(val).every((v) => v === "" || v === undefined)
    ) {
      return undefined;
    }

    return val;
  },
  z
    .object({
      name: z.string().min(3, "Location name is required"),
      address: z.string().min(3, "Address is required"),
      city: z.string().min(2, "City is required"),
      state: z.string().min(2, "State is required"),
      zip: z.string().min(5, "ZIP code is required"),
      timezone: z.string().min(1, "Timezone is required"),
    })
    .optional(),
);
const optionalUser = z.preprocess(
  (val) => {
    if (
      typeof val === "object" &&
      val !== null &&
      Object.values(val).every((v) => v === "" || v === undefined)
    ) {
      return undefined;
    }

    return val;
  },
  z
    .object({
      first_name: z.string().min(3, "First name is required"),
      last_name: z.string().min(3, "Last name is required"),
      email: z.string().min(3, "Email is required"),
      phone: validate.phoneOptional,
    })
    .optional(),
);

export const validateBookingRequest = z
  .object({
    start: datetimeLocalToDate,
    end: datetimeLocalToDate,
    notes: z.string().optional(),
    status: z.enum(BOOKING_STATUSES),
    author_user_id: z.uuidv7(),
    client_id: uuidv7OrNullFromForm,
    user: optionalUser,
    location_id: uuidv7OrNullFromForm,
    timeline_id: uuidv7OrNullFromForm,
    location: optionalLocation,
  })
  .superRefine((data, ctx) => {
    if (!data.location_id && !data.location) {
      ctx.addIssue({
        code: "custom",
        path: ["search.locations"],
        message: "An existing location or new location is required",
      });
    }

    if (data.location_id && data.location) {
      ctx.addIssue({
        code: "custom",
        path: ["search.locations"],
        message: "Choose either an existing location or create a new location",
      });
    }

    if (!data.client_id && !data.user) {
      ctx.addIssue({
        code: "custom",
        path: ["search.users"],
        message: "An existing client or new user is required",
      });
    }

    if (data.client_id && data.user) {
      ctx.addIssue({
        code: "custom",
        path: ["search.users"],
        message: "Choose either an existing client or create a new user",
      });
    }

    if (data.end < data.start) {
      ctx.addIssue({
        code: "custom",
        // path: ["end"],
        message: "End time must be after start time",
      });
    }
  });
