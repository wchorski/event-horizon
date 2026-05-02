import type { BookingSelect, UserSelect } from "@ty/Schema";
import { prettyDateToLocale } from "./formatters";

export const bookingSummary = (booking: BookingSelect, client: UserSelect|null) =>
  `${client?.first_name} ${prettyDateToLocale(booking.start)} (rev ${booking.revision})`;
