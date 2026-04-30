export type Address = {
  address_1: string;
  address_2: string | null;
  city: string;
  state: string | "Illinois" | "Indiana" | "Iowa";
  zip: number;
};
