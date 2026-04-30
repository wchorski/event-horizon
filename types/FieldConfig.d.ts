// FieldConfig.d.ts
import type { HTMLAttributes } from "astro/types";
import type { JSX } from "astro/jsx-runtime";

type InputProps = JSX.IntrinsicElements["input"];
type ReservedTypes = "select" | "textarea" | "searchSelect";
// InputTypeAttr keeps string & {} for component prop usage (autocomplete + escape hatch)
export type InputTypeAttr =
  | Exclude<InputProps["type"], ReservedTypes>
  | (string & {});

// KnownInputTypes — no string & {}, so the discriminant can actually work
type KnownInputTypes = Exclude<InputProps["type"], ReservedTypes>;

type BaseInputAttrs = Omit<HTMLAttributes<"input">, "value" | "type">;

export type FieldOption = {
  value: string;
  label: string;
};

type BaseFieldSlot = {
  label?: string;
  value?: string;
  readonly?: boolean;
};

export type InputFieldSlot = BaseFieldSlot &
  BaseInputAttrs & {
    type?: KnownInputTypes; // ← was InputTypeAttr, string & {} killed the discriminant
    datalist?: FieldOption[];
  };

export type CheckboxFieldSlot = BaseFieldSlot &
  BaseInputAttrs & {
    type: "checkbox";
    checked?: boolean;
  };

export type SelectFieldSlot = BaseFieldSlot &
  Omit<HTMLAttributes<"select">, "value" | "type"> & {
    type: "select";
    options: FieldOption[];
  };

export type TextareaFieldSlot = BaseFieldSlot &
  Omit<HTMLAttributes<"textarea">, "value" | "type"> & {
    type: "textarea";
  };

export type SearchSelectFieldSlot = BaseFieldSlot &
  Omit<HTMLAttributes<"input">, "value" | "type"> & {
    type: "searchSelect";
    options?: FieldOption[];
    endpoint?: string;
    valueKey?: string;
    primaryTemplate?: string;
    secondaryTemplate?: string;
    inputTemplate?: string;
    metaTemplate?: string;
    searchKeys?: string[];
    limit?: number;
    minChars?: number;
    debounce?: number;
    preloadItem?: Record<string, unknown>;
  };

export type FieldSlot =
  | InputFieldSlot
  | SelectFieldSlot
  | TextareaFieldSlot
  | SearchSelectFieldSlot;
export type FieldType = FieldSlot["type"];
type InputFieldType = Exclude<FieldType, "select" | "textarea">;
type SelectFieldType = Exclude<FieldType, "input" | "textarea">;

export type BaseRow = Record<
  string,
  string | number | boolean | Date | null | undefined
> & { id: string };

export type FieldConfig<TRow extends BaseRow = BaseRow> = {
  [K in keyof TRow]?: FieldSlot;
};

// TODO full send into HTML fields only being strings. Value coersion happens in validation
// export type FieldValue = string | number | boolean | Date | File | null;
export type FieldValue = string | null | undefined;
