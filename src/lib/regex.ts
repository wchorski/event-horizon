export const isIdField = (key: string) => /(_id|Id)$|^id$/.test(key);
export const isTimeField = (key: string) => key === "start" || key === "end";
export const isCheckboxField = (key: string) =>
  key === "tbd" || /^is[A-Z]/.test(key);
