export type FormFields<T> = Partial<Record<keyof T, string>>;

export type SelectOption = {
  value: string;
  label: string;
};
