// types/OutlookEvent.d.ts
import type { Event, ItemBody, Location, DateTimeTimeZone } from "@microsoft/microsoft-graph-types";

export interface EventCreatePayload {
  subject: string;
  body: ItemBody;
  start: DateTimeTimeZone;
  end: DateTimeTimeZone;
  location: Location;
  attendees: Attendee[];
  transactionId: string;
}
export type EventUpdatePayload = Omit<EventCreatePayload, "transactionId">;

export interface EventFormData extends EventCreatePayload {
  folderId: string;
}

export type OutlookEventSummary = Pick<Event, "id" | "webLink">;

export type RenderResult =
  | { kind: "success"; eventId: string; webLink?: string | null; mode: "created" | "updated" }
  | { kind: "top-error"; message: string };