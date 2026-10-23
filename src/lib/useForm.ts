// lib/form-action.ts
import { z, type ZodType } from "astro/zod";
import { fail, succeed, type FormState } from "@lib/form-state";
import { APIError } from "better-auth/api";

import { findDrizzlePgError, columnFromDetail } from "@lib/errors";

type ConstraintMap = Record<
  string,
  { field?: string; message: string; status?: number }
>;

export class FormError extends Error {
  constructor(
    message: string,
    public status = 422,
    public field?: string,
  ) {
    super(message);
  }
}

export type ActionResult<T> =
  | { ok: true; data: T; state: FormState }
  | { ok: false; state: FormState };

type Opts<S extends ZodType | undefined, T> = {
  schema?: S;
  labels?: Record<string, string>;
  sensitive?: string[]; // never echoed back into values
  successMessage?: string | ((data: T) => string);
  constraints?: ConstraintMap;
  run: (
    input: S extends ZodType ? z.output<S> : Record<string, string>,
  ) => Promise<T>;
};

function zodFailure(e: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  let formError: string | undefined;

  for (const issue of e.issues) {
    const key = issue.path[0];
    if (key === undefined) {
      formError ??= issue.message; // schema-level issue, no field to mark
    } else {
      fieldErrors[String(key)] ??= issue.message; // first message per field wins
    }
  }

  return { status: 422, fieldErrors, error: formError };
}

function toFailure(e: unknown, constraints?: ConstraintMap) {
  if (e instanceof z.ZodError) return zodFailure(e);

  if (e instanceof FormError) {
    return e.field
      ? { status: e.status, fieldErrors: { [e.field]: e.message } }
      : { status: e.status, error: e.message };
  }

  const pg = findDrizzlePgError(e);
  if (pg) {
    const hit = pg.constraint ? constraints?.[pg.constraint] : undefined;

    if (hit) {
      return hit.field
        ? {
            status: hit.status ?? 409,
            fieldErrors: { [hit.field]: hit.message },
          }
        : { status: hit.status ?? 409, error: hit.message };
    }

    // Unmapped: log the useful bits, not the whole error (it contains query params)
    console.error("Unmapped pg error", {
      code: pg.code,
      constraint: pg.constraint,
      table: pg.table,
    });

    switch (pg.code) {
      case "23505": {
        const field = columnFromDetail(pg.detail);
        return field
          ? {
              status: 409,
              fieldErrors: { [field]: "That value is already in use" },
            }
          : { status: 409, error: "That already exists." };
      }
      case "23503":
        return { status: 409, error: "This record is linked to other data." };
      case "23502":
      case "23514":
        return {
          status: 422,
          error: "Some of the submitted values are not allowed.",
        };
    }
  }

  // better-auth api
  if (e instanceof APIError) {
    const status = Number(e.status) || 500;
    console.log("❌ better-auth error");
    console.error(e); // keep full detail server-side
    return status >= 500
      ? { status, error: "Something went wrong on our end." }
      : { status, error: e.message };
  }

  console.error(e);
  return { status: 500, error: "Something went wrong." };
}

export async function useForm<S extends ZodType | undefined, T>(
  formData: FormData,
  o: Opts<S, T>,
): Promise<ActionResult<T>> {
  const entries = Object.fromEntries(
    [...formData.entries()].filter(([k]) => !k.startsWith("_")),
  ) as Record<string, string>;
  const values = Object.fromEntries(
    Object.entries(entries).filter(([k]) => !o.sensitive?.includes(k)),
  );

  try {
    const input = o.schema ? o.schema.parse(entries) : entries;
    const data = await o.run(input as any);
    const msg =
      typeof o.successMessage === "function"
        ? o.successMessage(data)
        : (o.successMessage ?? "");
    return { ok: true, data, state: succeed(msg) };
  } catch (e) {
    return { ok: false, state: fail({ ...toFailure(e, o.constraints), values, labels: o.labels }) };
  }
}
