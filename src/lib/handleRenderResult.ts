// lib/handleRenderResult.ts
import type { HttpMethod, RenderResult } from "@ty/Results";
import type { ZodError } from "astro/zod";

type FlattenedZodError = ReturnType<ZodError["flatten"]>;

export function handleResult<T>(opts: {
  error?: unknown;
  entity?: T | null | undefined;
  method: HttpMethod;
  emptyMessage: string;
}): RenderResult<T> {
  const { error, entity, method, emptyMessage } = opts;

  // if (error && typeof error === "object" && "fieldErrors" in error) {
  //   return { kind: "field-error", errors: error };
  // }

  if (
    error &&
    typeof error === "object" &&
    "formErrors" in error &&
    "fieldErrors" in error
  ) {
    const zodError = error as FlattenedZodError;

    if (zodError.formErrors.length > 0) {
      return {
        kind: "top-error",
        message: String(zodError.formErrors[0]),
      };
    }

    return {
      kind: "field-error",
      errors: zodError,
    };
  }

  if (error) {
    return {
      kind: "top-error",
      message: typeof error === "string" ? error : JSON.stringify(error),
    };
  }

  if (entity) {
    return {
      kind: "success",
      entity,
      method,
    };
  }

  return { kind: "top-error", message: emptyMessage };
}
