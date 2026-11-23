// db/relations.ts
import { defineRelations } from "drizzle-orm";
import * as appSchema from "@db/schema";
import * as authSchema from "@db/auth-schema";

export const relations = defineRelations(
  { ...appSchema, ...authSchema },
  (r) => ({
    user: {
      // better-auth (manual copy)
      sessions: r.many.session({
        from: r.user.id,
        to: r.session.userId,
      }),
      accounts: r.many.account({
        from: r.user.id,
        to: r.account.userId,
      }),
      passkeys: r.many.passkey({
        from: r.user.id,
        to: r.passkey.userId,
      }),
      teamMembers: r.many.teamMember({
        from: r.user.id,
        to: r.teamMember.userId,
      }),
      members: r.many.member({
        from: r.user.id,
        to: r.member.userId,
      }),
      invitations: r.many.invitation({
        from: r.user.id,
        to: r.invitation.inviterId,
      }),
      // app
      authoredLocations: r.many.location({
        from: r.user.id,
        to: r.location.authorUserId,
        alias: "location_author",
      }),
      authoredBookings: r.many.booking({
        from: r.user.id,
        to: r.booking.authorUserId,
        alias: "booking_author",
      }),
      clientBookings: r.many.booking({
        from: r.user.id.through(r.bookingClient.userId),
        to: r.booking.id.through(r.bookingClient.bookingId),
        alias: "booking_clients",
      }),
    },
    organization: {
      // better-auth (manual copy)
      teams: r.many.team({
        from: r.organization.id,
        to: r.team.organizationId,
      }),
      members: r.many.member({
        from: r.organization.id,
        to: r.member.organizationId,
      }),
      invitations: r.many.invitation({
        from: r.organization.id,
        to: r.invitation.organizationId,
      }),
      // app
      // ...
    },
    location: {
      author: r.one.user({
        from: r.location.authorUserId,
        to: r.user.id,
        alias: "location_author",
      }),
    },
    booking: {
      author: r.one.user({
        from: r.booking.authorUserId,
        to: r.user.id,
        alias: "booking_author",
      }),
      clients: r.many.user({
        from: r.booking.id.through(r.bookingClient.bookingId),
        to: r.user.id.through(r.bookingClient.userId),
        alias: "booking_clients",
      }),
      location: r.one.location({
        from: r.booking.locationId,
        to: r.location.id,
        alias: "booking_location",
      }),
      timeline: r.one.timeline({
        from: r.booking.id,
        to: r.timeline.bookingId,
      }),
    },
    timeline: {
      bookings: r.many.booking({
        from: r.timeline.bookingId,
        to: r.booking.id,
      }),
    },
    // event: {
    //   booking: r.many.booking(),
    //   userViaEventHosts: r.many.user({
    //     from: r.event.id.through(r.eventHost.eventId),
    //     to: r.user.id.through(r.eventHost.userId),
    //     alias: "event_id_user_id_via_eventHosts",
    //   }),
    //   user: r.one.user({
    //     from: r.event.authorUserId,
    //     to: r.user.id,
    //     alias: "event_authorUserId_user_id",
    //   }),
    //   location: r.one.location({
    //     from: r.event.locationId,
    //     to: r.location.id,
    //   }),
    //   organization: r.one.organization({
    //     from: r.event.organizationId,
    //     to: r.organization.id,
    //   }),
    //   meetingPacket: r.many.meetingPacket(),
    //   userViaTicket: r.many.user({
    //     from: r.event.id.through(r.ticket.eventId),
    //     to: r.user.id.through(r.ticket.userId),
    //     alias: "event_id_user_id_via_ticket",
    //   }),
    // },
    // organization: {
    //   booking: r.many.booking(),
    //   event: r.many.event(),
    //   integrationCredential: r.many.integrationCredential(),
    //   // userViaInvitation: r.many.user({
    //   //   alias: "user_id_organization_id_via_invitations",
    //   // }),
    //   userViaLocation: r.many.user({
    //     from: r.organization.id.through(r.location.organizationId),
    //     to: r.user.id.through(r.location.authorUserId),
    //     alias: "user_id_organization_id_via_location",
    //   }),
    //   userViaMembers: r.many.user({
    //     from: r.organization.id.through(r.member.organizationId),
    //     to: r.user.id.through(r.member.userId),
    //     alias: "organization_id_user_id_via_members",
    //   }),
    //   // team: r.many.team(),
    // },
    // integrationCredential: {
    //   organization: r.one.organization({
    //     from: r.integrationCredential.organizationId,
    //     to: r.organization.id,
    //   }),
    // },
    // meetingPacket: {
    //   event: r.one.event({
    //     from: r.meetingPacket.eventId,
    //     to: r.event.id,
    //   }),
    // },
  }),
);
