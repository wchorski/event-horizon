import type { InputTypeAttr } from "@ty/FieldConfig";

export const inputFieldValue = (
  fieldType: InputTypeAttr,
  name: string,
  rawValue: string | boolean | number,
  formData: FormData,
) => {
  switch (fieldType) {
    case "number":
      return rawValue === "" ? null : Number(rawValue);

    case "checkbox":
      return formData.has(name);

    case "datetime-local":
      return typeof rawValue === "string" && rawValue !== ""
        ? new Date(rawValue)
        : null;

    default:
      return rawValue ?? "";
  }
};
