// lib/useForm.ts
import { z, type ZodType } from "astro/zod";
import { APIError } from "better-auth/api";
import { fail, succeed, type FormState, type FormValues } from "@lib/form-state";

export type RawInput = Record<string, FormDataEntryValue | FormDataEntryValue[]>;
// What `run` receives: the parsed Zod output, or the raw object if no schema.
type Input<S extends ZodType | undefined> = S extends ZodType ? z.output<S> : RawInput;

type Opts<S extends ZodType | undefined, T> = {
  schema?: S;
  labels?: Record<string, string>;
  sensitive?: string[];
  successMessage?: string | ((data: T) => string);
  constraints?: ConstraintMap;
  run: (input: Input<S>) => Promise<T>;
};

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
    const status = e.statusCode ?? 500;
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
  const raw = formDataToObject(formData);
  const values = echoValues(raw, o.sensitive);

  try {
    const input = (o.schema ? o.schema.parse(raw) : raw) as Input<S>;
    const data = await o.run(input);
    const msg =
      typeof o.successMessage === "function"
        ? o.successMessage(data)
        : (o.successMessage ?? "");
    return { ok: true, data, state: succeed(msg) };
  } catch (e) {
    console.log({ e });
    return {
      ok: false,
      state: fail({ ...toFailure(e, o.constraints), values, labels: o.labels }),
    };
  }
}

function formDataToObject(fd: FormData): RawInput {
  const out: RawInput = {};
  for (const key of new Set(fd.keys())) {
    if (key.startsWith("_")) continue;
    const all = fd.getAll(key);
    out[key] = all.length > 1 ? all : all[0]; // repeated key → array
  }
  return out;
}

// echo-back values: strings only (never Files), arrays allowed, minus sensitive
function echoValues(raw: RawInput, sensitive: string[] = []): FormValues {
  const out: FormValues = {};
  for (const [k, v] of Object.entries(raw)) {
    if (sensitive.includes(k)) continue;
    if (Array.isArray(v)) out[k] = v.filter((x): x is string => typeof x === "string");
    else if (typeof v === "string") out[k] = v;
  }
  return out;
}


//? coresion handled by zod
/** Single yes/no checkbox: absent (unchecked) → false, present → true */
// export const checkboxBool = z.preprocess((v) => {
//   const last = Array.isArray(v) ? v[v.length - 1] : v;
//   return last === "on" || last === "true" || last === "1";
// }, z.boolean());

//? already natively handled by checkboxes that share the same name
/** Radio group / select: one string, absent when nothing chosen */
// export const checkboxRadio = <const T extends readonly [string, ...string[]]>(
//   options: T,
//   message = "Please choose an option",
// ) =>
//   z.enum(options, {
//     error: (iss) => (iss.input === undefined ? message : undefined),
//   });
