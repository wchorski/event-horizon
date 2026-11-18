// db/relations.ts
import { defineRelations } from "drizzle-orm";
import * as appSchema from "@db/schema";
import * as authSchema from "@db/auth-schema";

export const relations = defineRelations({ ...appSchema, ...authSchema }, (r) => ({
  user: {
    bookingViaBookingAssignment: r.many.booking({
      from: r.user.id.through(r.bookingAssignment.userId),
      to: r.booking.id.through(r.bookingAssignment.bookingId),
      alias: "booking_id_user_id_via_bookingAssignment",
    }),
    bookingViaBookingClient: r.many.booking({
      alias: "booking_id_user_id_via_bookingClient",
    }),
    bookingAuthorUserId: r.many.booking({
      alias: "booking_authorUserId_user_id",
    }),
    eventViaEventHosts: r.many.event({
      alias: "event_id_user_id_via_eventHosts",
    }),
    eventAuthorUserId: r.many.event({
      alias: "event_authorUserId_user_id",
    }),
    eventViaTicket: r.many.event({
      alias: "event_id_user_id_via_ticket",
    }),
    bookingViaTimelines: r.many.booking({
      alias: "booking_id_user_id_via_timelines",
    }),
	organizationViaLocation: r.many.organization({
        from: r.user.id.through(r.location.authorUserId),
        to: r.organization.id.through(r.location.organizationId),
        alias: "user_id_organization_id_via_location",
    }),
  },
  booking: {
    userViabookingAssignment: r.many.user({
      from: r.booking.id.through(r.bookingAssignment.bookingId),
      to: r.user.id.through(r.bookingAssignment.userId),
      alias: "booking_id_user_id_via_bookingAssignment",
    }),
    userViabookingClient: r.many.user({
      from: r.booking.id.through(r.bookingClient.bookingId),
      to: r.user.id.through(r.bookingClient.userId),
      alias: "booking_id_user_id_via_bookingClient",
    }),
    author: r.one.user({
      from: r.booking.authorUserId,
      to: r.user.id,
      alias: "booking_authorUserId_user_id",
    }),
    event: r.one.event({
      from: r.booking.eventId,
      to: r.event.id,
    }),
    location: r.one.location({
      from: r.booking.locationId,
      to: r.location.id,
    }),
    organization: r.one.organization({
      from: r.booking.organizationId,
      to: r.organization.id,
    }),
    userViaTimelines: r.many.user({
      from: r.booking.id.through(r.timeline.bookingId),
      to: r.user.id.through(r.timeline.ownerUserId),
      alias: "booking_id_user_id_via_timelines",
    }),
  },
  event: {
    booking: r.many.booking(),
    userViaEventHosts: r.many.user({
      from: r.event.id.through(r.eventHost.eventId),
      to: r.user.id.through(r.eventHost.userId),
      alias: "event_id_user_id_via_eventHosts",
    }),
    user: r.one.user({
      from: r.event.authorUserId,
      to: r.user.id,
      alias: "event_authorUserId_user_id",
    }),
    location: r.one.location({
      from: r.event.locationId,
      to: r.location.id,
    }),
    organization: r.one.organization({
      from: r.event.organizationId,
      to: r.organization.id,
    }),
    meetingPacket: r.many.meetingPacket(),
    userViaTicket: r.many.user({
      from: r.event.id.through(r.ticket.eventId),
      to: r.user.id.through(r.ticket.userId),
      alias: "event_id_user_id_via_ticket",
    }),
  },
  location: {
    booking: r.many.booking(),
    event: r.many.event(),
  },
  organization: {
    booking: r.many.booking(),
    event: r.many.event(),
    integrationCredential: r.many.integrationCredential(),
    // userViaInvitation: r.many.user({
    //   alias: "user_id_organization_id_via_invitations",
    // }),
    userViaLocation: r.many.user({
        from: r.organization.id.through(r.location.organizationId),
        to: r.user.id.through(r.location.authorUserId),
        alias: "user_id_organization_id_via_location",
    }),
    userViaMembers: r.many.user({
      from: r.organization.id.through(r.member.organizationId),
      to: r.user.id.through(r.member .userId),
      alias: "organization_id_user_id_via_members",
    }),
    // team: r.many.team(),
  },
  integrationCredential: {
    organization: r.one.organization({
      from: r.integrationCredential.organizationId,
      to: r.organization.id,
    }),
  },
  meetingPacket: {
    event: r.one.event({
      from: r.meetingPacket.eventId,
      to: r.event.id,
    }),
  },
}));
