// lib/handleRenderResult.ts
import type { QueryResult, } from "@ty/Results";

export function handleQueryResult<T>(opts: {
  error?: unknown;
  rows?: T[] | null ;
  method: "POST";
  emptyMessage: string;
}): QueryResult<T> {
  const { error, rows, method, emptyMessage } = opts;

  if (error && typeof error === "object" && "fieldErrors" in error) {
    return { kind: "field-error", errors: error };
  }

  if (error) {
    return {
      kind: "top-error",
      message: typeof error === "string" ? error : JSON.stringify(error),
    };
  }

  if (rows) {
    return {
      kind: "success",
      rows,
      method,
    };
  }

  return { kind: "top-error", message: emptyMessage };
}
``;
