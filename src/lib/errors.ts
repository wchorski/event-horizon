import { ZodError } from "astro:schema";
import { z } from 'astro/zod'
// import { LibsqlError } from "@libsql/client";
import { DrizzleQueryError } from "drizzle-orm/errors";

// --- Error Classes ---
// 422
export class ValidationError<T> extends Error {
  flattened: ReturnType<ZodError["flatten"]>;
  constructor(flattened: z.core.$ZodFlattenedError<T>) {
    super("Validation failed");
    this.name = "ValidationError";
    this.flattened = flattened;
  }
}
// 404
export class NotFoundError extends Error {
  constructor(message: string) {
    super("Not Found: " + message);
    this.name = "NotFoundError";
  }
}
// 400
export class BadRequestError extends Error {
  constructor(message: string) {
    super("Bad Request: " + message);
    this.name = "BadRequestError";
  }
}
// 409
export class ConflictError extends Error {
  constructor(message: string) {
    super("Conflict: " + message);
    this.name = "ConflictError";
  }
}
// “you aren’t authenticated–either not authenticated at all or authenticated incorrectly–but please reauthenticate and try again.”
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super("Unauthorized: " + message);
    this.name = "UnauthorizedError";
  }
}
// “I’m sorry. I know who you are–I believe who you say you are–but you just don’t have permission to access this resource. Maybe if you ask the system administrator nicely, you’ll get permission. But please don’t bother me again until your predicament changes.”
export class ForbiddenError extends Error {
  constructor(message: string) {
    super("Forbidden: " + message);
    this.name = "ForbiddenError";
  }
}

// --- For use in CRUD registry methods ---
// Catches low-level DB/zod errors and re-throws as domain errors
// TODO use only if statements in error handling. like the func below
export function throwErrorsForCRUD(e: unknown): never {
  if (
    e instanceof NotFoundError ||
    e instanceof ConflictError ||
    e instanceof ValidationError
  ) {
    throw e;
  }

  if (e instanceof ZodError) throw new ValidationError(z.flattenError(e));

  // TODO falls apart if using a different database. look into using `isUniqueConstraintError`
  // if (
  //   e instanceof LibsqlError &&
  //   (e as LibsqlError).extendedCode === "SQLITE_CONSTRAINT_UNIQUE"
  // ) {
  //   const match = (e as LibsqlError).message.match(
  //     /UNIQUE constraint failed: (\w+\.\w+)/,
  //   )?.[1];

  //   throw new ConflictError(
  //     match
  //       ? `Duplicate: Item with "${match}" already exists`
  //       : `A duplicate entry already exists. [${e.message}]`,
  //   );
  // }

  if (e instanceof DrizzleQueryError) {
    const cause = e.cause as any;
    if (cause.code === "23505") {
      const match = cause.detail.match(/Key \((.*?)\)=\((.*?)\)/);

      const key = match[1];
      const value = match[2];

      throw new ConflictError(
        match?.[1]
          ? `A duplicate ${cause.table || "RECORD"} with ${key} "${value}" already exists`
          : `A duplicate entry already exists for this entry.`,
      );
    }
    if (cause.code === "23503") {
      const match = cause.detail.match(/Key \((.*?)\)=\((.*?)\)/);

      const key = match[1];
      const value = match[2];

      throw new ConflictError(
        match?.[1]
          ? `Resource with ${key}:${value} is still in use by a "${cause.table || "RECORD"}". You must first remove the connected "${cause.table}" to allow the removal of this record.`
          : `This record is currently in use and cannot be deleted.`,
      );
    } else {
      console.log("❌❌❌ DrizzleQueryError");
      console.log(e.cause);
    }
  }

  const msg = e instanceof Error ? e.message : String(e);

  throw new Error(msg);
}

// function isUniqueConstraintError(e: unknown): { field?: string } | null {
//   // SQLite / libSQL (Astro DB default)
//   if (e instanceof LibsqlError && e.extendedCode === "SQLITE_CONSTRAINT_UNIQUE") {
//     const field = e.message.match(
//       /UNIQUE constraint failed: (\w+\.\w+)/
//     )?.[1];
//     return { field };
//   }

//   // Postgres (Drizzle + pg)
//   const anyErr = e as any;
//   if (anyErr?.code === "23505") {
//     // constraint name is often here
//     const constraint = anyErr.constraint ?? anyErr.message;
//     return { field: constraint };
//   }

//   return null;
// }

// --- For use in partials ---
// Maps domain errors to { err, status } for the response

export function errorHandlingOnSubmit(e: unknown): {
  err: string | ReturnType<ZodError["flatten"]>;
  status: number;
} {
  if (e instanceof BadRequestError) {
    return { status: 400, err: e.message };
  }
  if (e instanceof UnauthorizedError) {
    return { status: 401, err: e.message };
  }
  if (e instanceof ForbiddenError) {
    return { status: 403, err: e.message };
  }
  if (e instanceof NotFoundError) {
    return { status: 404, err: e.message };
  }
  if (e instanceof ConflictError) {
    return { status: 409, err: e.message };
  }
  if (e instanceof ZodError) {
    return { err: z.flattenError(e), status: 422 };
  }
  if (e instanceof ValidationError) {
    return { status: 422, err: e.flattened };
  }

  const msg = e instanceof Error ? e.message : String(e);
  return { status: 500, err: "An unexpected error occurred: " + msg };
}

export class WordpressApiError extends Error {
  status: number;
  wpCode?: string;
  wpData?: any;
  wpMessage?: string;
  responseBody?: any;

  constructor(opts: {
    status: number;
    message: string;
    wpCode?: string;
    wpMessage?: string;
    wpData?: any;
    responseBody?: any;
  }) {
    super(opts.message);
    this.name = "WordpressApiError";
    this.status = opts.status;
    this.wpCode = opts.wpCode;
    this.wpMessage = opts.wpMessage;
    this.wpData = opts.wpData;
    this.responseBody = opts.responseBody;
  }
}
