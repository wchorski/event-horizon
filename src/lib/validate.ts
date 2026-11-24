import { z, type ZodType } from "astro/zod";
import { normalizePhoneToE164Manual, slugify } from "@lib/formatters";
import {
  BOOKING_STATUSES,
  INTEGRATION_PROVIDERS,
  MEMBER_ROLES,
} from "@db/enums";
import { encryptSecret } from "@lib/auth/secretBox";

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
  authorUserId: z.uuidv7(),
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

export type IntegrationCredentialFormInput = z.input<
  typeof validateIntegrationCredentialForm
>;

export type IntegrationCredentialFormOutput = z.output<
  typeof validateIntegrationCredentialForm
>;

export const validateIntegrationCredentialForm = z
  .object({
    provider: z.enum(INTEGRATION_PROVIDERS),
    tenantId: z
      .string({
        error: "Tenant ID is required.",
      })
      .trim()
      .min(1, "Tenant ID is required.")
      .max(255, "Tenant ID is too long."),
    clientId: z
      .string({
        error: "Client ID is required.",
      })
      .trim()
      .min(1, "Client ID is required.")
      .max(255, "Client ID is too long."),
    secret: z
      .string({
        error: "Client secret is required.",
      })
      .trim()
      .min(1, "Client secret is required.")
      .max(4096, "Client secret is too long."),
  })
  .strict()
  .transform(({ secret, ...payload }) => {
    const { ciphertext, iv, authTag } = encryptSecret(secret);
    return {
      ...payload,
      secretCiphertext: ciphertext,
      secretIv: iv,
      secretAuthTag: authTag,
    };
  });

export type SignupCredentials = z.infer<typeof validate.signup>;
export type LoginCredentials = z.infer<typeof validate.login>;

//TODO look into this for local check https://github.com/HaveIBeenPwned/PwnedPasswordsDownloader
const commonPasswords = new Set(["password1!", "qwerty123!", "welcome1!"]);
const passwordVerification = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
  .refine((pw) => !commonPasswords.has(pw.toLowerCase()), {
    message: "This password is too common",
  });

//? form needs this helper to know how to handle multiple checkboxes with the same name
export const checkboxMulti = <T extends ZodType>(item: T) =>
  z.preprocess((v) => (v == null || v === "" ? [] : [v].flat()), z.array(item));

export const validate = {
  // TODO validate as a uuidv7 when i fix seed data?
  // id: z.uuid(),
  email: z.email().trim().toLowerCase(),
  login: z.object({
    email: z.email().trim().toLowerCase(),
    password: z.string().min(1, "Enter your password"),
  }),
  signup: z.object({
    email: z.email().trim().toLowerCase(),
    password: passwordVerification,
    firstName: z
      .string()
      .trim()
      .max(100)
      .min(3, "First name must be 3 characters or more"),
    lastName: z
      .string()
      .trim()
      .max(100)
      .min(1, "Last name must be 1 character or more"),
    image: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.url({ protocol: /^https?$/ }).optional(),
    ),
  }),
  datetimeLocalToDate,
  id: z.uuidv7(),
  bookingStatus: z.enum(BOOKING_STATUSES),
  integrationProvider: z.enum(INTEGRATION_PROVIDERS),
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
    firstName: z.string().trim().min(3, "Must be more than 3 characters"),
    lastName: z.string().trim().min(3, "Must be more than 3 characters"),
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

  packetBuild: z.object({
    folderId: z.string().regex(/^[\w!-]+$/, "Invalid folder id"),
  }),

  outlookEvent: z
    .object({
      folderId: z.string().regex(/^[\w!-]+$/, "Invalid folder id"),
      subject: z.string().trim().min(1, "Subject is required").max(255),
      start: z.object({
        dateTime: z.string().min(1, "Start is required"),
        timeZone: z.string().min(1),
      }),
      end: z.object({
        dateTime: z.string().min(1, "End is required"),
        timeZone: z.string().min(1),
      }),
      body: z.object({
        contentType: z.enum(["text", "html", "HTML", "Text"]),
        content: z.string(),
      }),
      location: z.object({ displayName: z.string() }),
      transactionId: z.string().min(1),
      attendees: z
        .array(
          z.object({
            emailAddress: z.object({
              address: z.email(),
              name: z.string().optional(),
            }),
            type: z.enum(["required", "optional", "resource"]),
          }),
        )
        .max(100)
        .default([]),
    })
    .refine((v) => new Date(v.end.dateTime) > new Date(v.start.dateTime), {
      message: "End must be after start",
      path: ["end", "dateTime"],
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
    authorUserId: z.uuidv7(),
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
      firstName: z.string().min(3),
      lastName: z.string().min(3),
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
        (data.firstName || data.lastName || data.email || data.phone)
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

  invitation: z.object({
    email: z.email("enter a valid email address"),
    role: z.enum(MEMBER_ROLES),
  }),
  member: z.object({
    teamIds: checkboxMulti(z.string().min(1)),
    // teamIds: z.array(z.string().min(1)).default([]),
    // teamIds: z.preprocess(
    //   (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]),
    //   z.array(z.string().min(1)),
    // ),
    role: z.enum(MEMBER_ROLES),
    notify: z.stringbool().default(false),
  }),
  team: z.object({
    name: z.string().min(3).max(20),
  }),
  organization: z.object({
    id: z.uuidv7(),
    name: z.string().min(3).max(50),
    slug: slugSchema,
    // color: z.string().min(3).optional(),
    // color_2: z.string().min(3).optional(),
    logo: z
      .url()
      .optional()
      .or(z.literal("").transform(() => undefined)),
    // dedicated_db_url: z.url().optional(),
    // integration_api_keys
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
      name: z.string().min(3, "Location name is required").toLowerCase(),
      address: z.string().min(3, "Address is required").toLowerCase(),
      city: z.string().min(2, "City is required").toLowerCase(),
      state: z.string().min(2, "State is required").toLowerCase(),
      zip: z.string().min(5, "Invalid ZIP code").max(5, "Invalid ZIP code"),
      timezone: z.string().min(1, "Timezone is required").toLowerCase(),
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
      firstName: z.string().min(3, "First name is required"),
      lastName: z.string().min(3, "Last name is required"),
      email: z.email().min(3, "Email is required").toLowerCase(),
      phone: validate.phoneOptional,
    })
    .optional(),
);

const MAX_CLIENTS = 10;
const emailSchema = z.string().email();

export const clientEmails = z
  .string()
  .optional()
  .transform((raw, ctx) => {
    // split on comma, semicolon, or any whitespace/newline
    const emails = [
      ...new Set(
        (raw ?? "")
          .split(/[,;\s]+/)
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];

    if (emails.length > MAX_CLIENTS) {
      ctx.addIssue({ code: "custom", message: `You can invite up to ${MAX_CLIENTS} clients` });
      return z.NEVER;
    }

    const invalid = emails.filter((e) => !emailSchema.safeParse(e).success);
    if (invalid.length) {
      ctx.addIssue({ code: "custom", message: `Not a valid email: ${invalid.join(", ")}` });
      return z.NEVER;
    }

    return emails; // string[]
  });

export const validateBookingRequest = z
  .object({
    start: datetimeLocalToDate,
    end: datetimeLocalToDate,
    notes: z.string().optional(),
    // status: z.enum(BOOKING_STATUSES),
    authorUserId: z.uuidv7(),
    client_id: uuidv7OrNullFromForm,
    client_emails: clientEmails,
    user: optionalUser,
    location_id: uuidv7OrNullFromForm,
    timeline_id: uuidv7OrNullFromForm,
    location: optionalLocation,
  })
  .superRefine((data, ctx) => {
    if (!data.location_id && !data.location) {
      ctx.addIssue({
        code: "custom",
        path: ["location_id"],
        message: "An existing location or new location is required",
      });
    }

    if (data.location_id && data.location) {
      ctx.addIssue({
        code: "custom",
        path: ["location_id"],
        message: "Choose either an existing location or create a new location",
      });
    }

    if (!data.client_id && !data.user) {
      ctx.addIssue({
        code: "custom",
        path: ["client_id"],
        message: "An existing client or new user is required",
      });
    }

    if (data.client_id && data.user) {
      ctx.addIssue({
        code: "custom",
        path: ["client_id"],
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
