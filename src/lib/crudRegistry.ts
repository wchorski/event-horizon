// src/lib/crudRegistry.ts
import type { TableContext, TableRow } from "@ty/Table";

import { db } from "@db/db";
import { Event, Ticket, Location, User } from "@db/schema";
import { eq } from "drizzle-orm";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  throwErrorsForCRUD,
} from "@lib/errors";
import { validate } from "./validate";
import { localDateTimeToRealDate } from "./formatters";
import {
  createWordpressEventPost,
  updateWordpressEventPost,
} from "./getsetWordpressPost";
import {
  userCan,
  sanitizeFields,
  userPolicy,
  creditPolicy,
} from "./auth/permissions";
import type { Session } from "./auth/session";
import { userCreditMap } from "./tableConfigs";
import type { FormFields } from "@ty/Form";
import type {
  EventSelect,
  TicketSelect,
  LocationSelect,
  UserCreditFlat as CourseCreditFlat,
  UserSelect,
  RoleSelect,
} from "@ty/Schema";

type CreateFn = (
  row: Omit<TableRow, "id">,
  session: Session,
) => Promise<TableRow>;
type ReadFn<T> = (id: string, session: Session) => Promise<T>;
type ReadManyFn<T> = (session: Session) => Promise<T[]>;
// type UpdateFn = (
//   row: Partial<TableRow> & { id: string },
//   session: Session,
// ) => Promise<TableRow>;
type UpdateFn<T> = (
  inputFields: FormFields<T> & { id: string },
  session: Session,
) => Promise<T>;
type DeleteFn<T> = (id: string, session: Session) => Promise<T>;

type CrudEntry<T = TableRow> = {
  create: CreateFn;
  read: ReadFn<T>;
  readMany: ReadManyFn<T>;
  update: UpdateFn<T>;
  delete: DeleteFn<T>;
};

const { DEFAULT_ROLE_ID, WP_USERNAME, WP_APP_PASSWORD } = import.meta.env;

export const crud = {
  // TODO how to prevent create/update users from giving themselves elevated permissions?
  users: {
    create: async (row, session) => {
      try {
        // permissions for individual fields verses whole schema... what a pain...
        // const fields = await userPolicy.writableFields(session, null);

        // const sanitized = sanitizeFields(row, fields);

        const validated = validate.userCreate.parse(row);

        const [result] = await db
          .insert(User)
          // TODO move this to frontend form instead.
          .values({ ...validated, role_id: DEFAULT_ROLE_ID ?? null })
          .returning();

        return result;
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },
    read: async (id, session) => {
      try {
        // TODO add in auth. mutation for ticket and user maybe tricky
        // const fields = await creditPolicy.writableFields(session, null);
        // const sanitized = sanitizeFields(row, fields);
        const validId = validate.id.parse(id);
        
        const [row] = await db
          .select()
          .from(User)
          .where(eq(User.id, validId))
          .limit(1);
        if (!row) throw new NotFoundError(`User ${id} not found`);
        return row;
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },
    readMany: async (session) => {
      try {
        const users = await db.select().from(User);
        // .limit(perPage)
        // .offset((page - 1) * perPage);
        return users;
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },
    update: async (row, session) => {
      try {
        // TODO add in auth. mutation for ticket and user maybe tricky
        // const fields = await creditPolicy.writableFields(session, null);
        // const sanitized = sanitizeFields(row, fields);
        const validated = validate.userUpdate.parse(row);

        const [result] = await db
          .update(User)
          .set(validated)
          .where(eq(User.id, validated.id))
          .returning();
        if (!result) throw new NotFoundError(`User ${validated.id} not found`);
        return result;
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },
    // TODO authentication
    // update: async (row, session) => {
    //   try {

    //     if (!await userPolicy.update(session, row))
    //       throw new ForbiddenError("User not allowed");
    //     const fields = await userPolicy.writableFields(session, row);
    //     const sanitizedRow = sanatizeFields(row, ["id", ...fields]);

    //     const validated = validate.userUpdate.parse(sanitizedRow);

    //     const [result] = await db
    //       .update(User)
    //       .set(validated)
    //       .where(eq(User.id, validated.id))
    //       .returning();
    //     if (!result)
    //       throw new NotFoundError(`User ${validated.id} not found`);
    //     return result;
    //   } catch (e) {
    //     throwErrorsForCRUD(e);
    //   }
    // },
    delete: async (id) => {
      try {
        const validId = validate.id.parse(id);
        const [deleted] = await db
          .delete(User)
          .where(eq(User.id, validId))
          .returning();
        if (!deleted) throw new NotFoundError(`User ${id} not found`);
        return deleted;
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },
  },
  events: {
    create: async (row, session) => {
      try {
        const validated = validate.courseCreate.parse(row);

        const [location] = await db
          .select()
          .from(Location)
          .where(eq(Location.id, validated.location_id))
          .limit(1);

        if (!location)
          throw new NotFoundError(
            `location: ${validated.location_id} does not exist`,
          );

        const realDate = localDateTimeToRealDate(
          validated.date_civil,
          location.timezone,
        );

        const wp_post_id =
          WP_USERNAME && WP_APP_PASSWORD
            ? (
                await createWordpressEventPost({
                  ...validated,
                  timestamp: realDate,
                })
              ).id
            : null;

        const [result] = await db
          .insert(Event)
          .values({
            ...validated,
            timestamp: realDate,
            wp_post_id,
          })
          .returning();
        return result;
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },
    read: async (id, session) => {
      try {
        const validId = validate.id.parse(id);
        const [row] = await db
          .select()
          .from(Event)
          .where(eq(Event.id, validId))
          .limit(1);
        if (!row) throw new NotFoundError(`Event ${id} not found`);
        return row;
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },
    readMany: async (session) => {
      try {
        const events = await db.select().from(Event);
        // .limit(perPage)
        // .offset((page - 1) * perPage);
        return events;
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },
    update: async (row, session) => {
      try {
        const validated = validate.courseUpdate.parse(row);

        const [location] = await db
          .select()
          .from(Location)
          .where(eq(Location.id, validated.location_id))
          .limit(1);

        if (!location)
          throw new NotFoundError(
            `location: ${validated.location_id} does not exist`,
          );
        const realDate = localDateTimeToRealDate(
          validated.date_civil,
          location.timezone,
        );
        const wp_post_id =
          WP_USERNAME && WP_APP_PASSWORD
            ? (
                await createWordpressEventPost({
                  ...validated,
                  timestamp: realDate,
                })
              ).id
            : null;
        const [result] = await db
          .update(Event)
          .set({
            ...validated,
            timestamp: realDate,
            wp_post_id: wp_post_id ?? validated.wp_post_id,
          })
          .where(eq(Event.id, validated.id))
          .returning();
        if (!result) throw new NotFoundError(`Event ${row.id} not found`);

        return result;
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },
    delete: async (id, session) => {
      try {
        const validId = validate.id.parse(id);
        const [deleted] = await db
          .delete(Event)
          .where(eq(Event.id, validId))
          .returning();
        if (!deleted) throw new NotFoundError(`Event ${id} not found`);
        return deleted;
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },
  },

  tickets: {
    create: async (row) => {
      try {
        const validated = validate.creditCreate.parse(row);

        const [result] = await db
          .insert(Ticket)
          .values({
            ...validated,
            timestamp: new Date(),
          })
          .returning();
        return result;
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },
    read: async (id) => {
      try {
        const validId = validate.id.parse(id);
        const [row] = await db
          .select()
          .from(Ticket)
          .where(eq(Ticket.id, validId))
          .limit(1);
        if (!row) throw new NotFoundError(`Ticket ${id} not found`);
        return row;
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },
    readMany: async (session) => {
      try {
        const tickets = await db.select().from(Ticket);
        // .limit(perPage)
        // .offset((page - 1) * perPage);
        return tickets;
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },
    update: async (row) => {
      try {
        const validated = validate.creditUpdate.parse(row);

        const [result] = await db
          .update(Ticket)
          .set(validated)
          .where(eq(Ticket.id, validated.id))
          .returning();
        if (!result) throw new NotFoundError(`Ticket ${row.id} not found`);
        return result;
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },

    delete: async (id) => {
      try {
        const validId = validate.id.parse(id);
        const [deleted] = await db
          .delete(Ticket)
          .where(eq(Ticket.id, validId))
          .returning();
        if (!deleted) throw new NotFoundError(`Ticket ${id} not found`);
        return deleted;
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },
  },
  locations: {
    create: async (row, session) => {
      try {
        const validated = validate.locationCreate.parse(row);

        const [result] = await db
          .insert(Location)
          .values(validated)
          .returning();
        return result;
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },
    readMany: async (session) => {
      try {
        const locations = await db.select().from(Location);
        // .limit(perPage)
        // .offset((page - 1) * perPage);
        return locations;
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },
    read: async (id, session) => {
      try {
        const validId = validate.id.parse(id);
        const [row] = await db
          .select()
          .from(Location)
          .where(eq(Location.id, validId))
          .limit(1);
        if (!row) throw new NotFoundError(`Location ${id} not found`);
        return row;
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },

    update: async (row, session) => {
      try {
        const validated = validate.locationUpdate.parse(row);
        const validId = validate.id.parse(row.id);
        const [result] = await db
          .update(Location)
          .set(validated)
          .where(eq(Location.id, validId))
          .returning();
        if (!result) throw new NotFoundError(`Location ${row.id} not found`);
        return result;
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },
    delete: async (id) => {
      try {
        const validId = validate.id.parse(id);
        const [deleted] = await db
          .delete(Location)
          .where(eq(Location.id, validId))
          .returning();
        if (!deleted) throw new NotFoundError(`Location ${id} not found`);
        return deleted;
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },
  },
  courseCredits: {
    create: async (row, session) => {
      try {
        // TODO add in auth. mutation for ticket and user maybe tricky
        // const fields = await creditPolicy.writableFields(session, null);
        // const sanitized = sanitizeFields(row, fields);
        const validated = validate.userCreditCreate.parse(row);

        return await db.transaction(async (tx) => {
          let user: typeof User.$inferSelect;
          let user_id: number;

          // --- Branch 1: link to existing user ---
          if ("user_id" in validated) {
            user_id = validated.user_id;

            const [found] = await tx
              .select()
              .from(User)
              .where(eq(User.id, user_id))
              .limit(1);

            if (!found) throw new NotFoundError(`User ${user_id} not found`);
            user = found;
          } else {
            const [created] = await tx
              .insert(User)
              .values({
                first_name: validated.first_name,
                last_name: validated.last_name,
                phone: validated.phone,
                email: validated.email,
                address_1: validated.address_1,
                city: validated.city,
                state: validated.state,
                zip: validated.zip,
              })
              .returning();

            if (!created) throw new Error("Failed to create user");

            user = created;
            user_id = created.id;
          }

          // --- Create ticket linked to resolved user_id ---
          const [ticket] = await tx
            .insert(Ticket)
            .values({
              attended: validated.attended,
              event_id: validated.courseId,
              user_id,
              timestamp: new Date(),
            })
            .returning();

          if (!ticket) throw new Error("Failed to create ticket");

          // flat return: user + ticket (ensure ticket.id wins)
          return { ...user, ...ticket, user_id: user.id, id: ticket.id };
        });
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },
    read: async (id, session) => {
      try {
        // TODO add in auth. mutation for ticket and user maybe tricky
        // const fields = await creditPolicy.writableFields(session, null);
        // const sanitized = sanitizeFields(row, fields);

        const validId = validate.id.parse(id);

        const [row] = await db
          .select()
          .from(Ticket)
          .innerJoin(User, eq(Ticket.user_id, User.id))
          .where(eq(Ticket.id, validId))
          .limit(1);
        if (!row) throw new NotFoundError(`Ticket ${id} not found`);
        return {
          ...row.users,
          ...row.tickets,
          user_id: row.tickets.id, // preserve user id before Ticket.id overwrites it
          id: row.tickets.id,
        };
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },
    update: async (
      inputFields: FormFields<CourseCreditFlat> & { id: string },
      session,
    ) => {
      try {
        // TODO add in auth. mutation for ticket and user maybe tricky
        // const fields = await creditPolicy.writableFields(session, null);
        // const sanitized = sanitizeFields(row, fields);
        const { id, user_id, event_id, attended, ...userFields } =
          validate.userCreditUpdate.parse(inputFields);

        // two updates but in a transaction so they succeed or fail together
        const result = await db.transaction(async (tx) => {
          const [ticket] = await tx
            .update(Ticket)
            .set({ attended })
            .where(eq(Ticket.id, id))
            .returning();
          if (!ticket) throw new NotFoundError(`Ticket ${id} not found`);

          const [user] = await tx
            .update(User)
            .set(userFields)
            .where(eq(User.id, user_id))
            .returning();
          if (!user) throw new NotFoundError(`User ${user_id} not found`);

          // return { ...ticket, ...user };
          return userCreditMap(ticket, user);
        });

        return result;
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },
    delete: async (id, session) => {
      try {
        const validId = validate.id.parse(id);
        const [deleted] = await db
          .delete(Ticket)
          .where(eq(Ticket.id, validId))
          .returning();
        if (!deleted) throw new NotFoundError(`Ticket ${id} not found`);

        const [user] = await db
          .select()
          .from(User)
          .where(eq(User.id, deleted.user_id))
          .limit(1);
        if (!user) throw new NotFoundError(`User not found`);

        return userCreditMap(deleted, user);
      } catch (e) {
        throwErrorsForCRUD(e);
      }
    },
  },
  // roles: {},
} satisfies CrudRegistry;
// } satisfies Record<string, CrudEntry>;

type CrudRegistry = {
  courseCredits: CrudEntry<CourseCreditFlat>;
  locations: CrudEntry<LocationSelect>;
  users: CrudEntry<UserSelect>;
  // roles: CrudEntry<RoleSelect>;
  events: CrudEntry<EventSelect>;
  tickets: CrudEntry<TicketSelect>;
  // ...
};
export type CrudRegistryType = keyof typeof crud;
