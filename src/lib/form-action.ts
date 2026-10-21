// lib/form-action.ts
import { z, type ZodType } from "astro/zod";
import { fail, succeed, type FormState } from "@lib/form-state";

export class FormError extends Error {
  constructor(message: string, public status = 422, public field?: string) {
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
  run: (input: S extends ZodType ? z.output<S> : Record<string, string>) => Promise<T>;
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

function toFailure(e: unknown) {
  if (e instanceof z.ZodError) return zodFailure(e);

  if (e instanceof FormError) {
    return e.field
      ? { status: e.status, fieldErrors: { [e.field]: e.message } }
      : { status: e.status, error: e.message };
  }

  console.error(e);
  return { status: 500, error: "Something went wrong." };
}

export async function runForm<S extends ZodType | undefined, T>(
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
    const msg = typeof o.successMessage === "function" ? o.successMessage(data) : (o.successMessage ?? "");
    return { ok: true, data, state: succeed(msg) };
  } catch (e) {
    return { ok: false, state: fail({ ...toFailure(e), values, labels: o.labels }) };
  }
}