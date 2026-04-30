export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type RenderResult<T, E = ZodErrorFlattened> =
  | { kind: "field-error"; errors: E }
  | { kind: "top-error"; message: string }
  | { kind: "success"; entity: T; method: HttpMethod };

export type QueryResult<T> =
  | { kind: "field-error"; errors: E }
  | { kind: "top-error"; message: string }
  | { kind: "success"; rows: T[]; method: "POST" };
