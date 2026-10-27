// Echoed-back raw input for re-rendering the form after a failed submit.
// Strings only (never File); repeated keys (multi checkbox) become string[].
export type FormValues = Record<string, string | string[]>;

export type FormState = {
  status: number;
  error?: string;
  success?: string;
  fieldErrors: Record<string, string>;
  values: FormValues;
};

export const emptyForm = (): FormState => ({
  status: 200,
  fieldErrors: {},
  values: {},
});

type FailOpts = {
  status?: number;
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: FormValues;
  labels?: Record<string, string>;
};

export function fail({
  status = 422,
  error,
  fieldErrors = {},
  values = {},
  labels = {},
}: FailOpts): FormState {
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

/** Read an echoed value as a list, whether it's a string, string[], or absent. */
export const valuesAsList = (v: FormValues[string] | undefined): string[] =>
  v === undefined ? [] : [v].flat();