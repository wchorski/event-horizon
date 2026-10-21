// lib/form-state.ts
export type FormState = {
  status: number;
  error?: string;
  success?: string;
  fieldErrors: Record<string, string>;
  values: Record<string, string>;
};

export const emptyForm = (): FormState => ({ status: 200, fieldErrors: {}, values: {} });

export function fail(opts: {
  status?: number;
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
  labels?: Record<string, string>;
}): FormState {
  const { status = 422, error, fieldErrors = {}, values = {}, labels = {} } = opts;
  const names = Object.keys(fieldErrors).map((n) => labels[n] ?? n);

  return {
    status,
    // rule: only field errors -> generated top-level message
    error:
      error ??
      (names.length
        ? `Check the marked fields (${names.join(", ")}) for errors.`
        : "Something went wrong."),
    fieldErrors,
    values,
  };
}

// rule: success wipes errors, and the form resets
export const succeed = (success: string): FormState => ({
  status: 200,
  success,
  fieldErrors: {},
  values: {},
});