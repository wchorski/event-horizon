ALTER TABLE "bookings" RENAME TO "booking";--> statement-breakpoint
ALTER TABLE "booking_assignments" RENAME TO "booking_assignment";--> statement-breakpoint
ALTER TABLE "booking_clients" RENAME TO "booking_client";--> statement-breakpoint
ALTER TABLE "events" RENAME TO "event";--> statement-breakpoint
ALTER TABLE "event_hosts" RENAME TO "event_host";--> statement-breakpoint
ALTER TABLE "integration_credentials" RENAME TO "integration_credential";--> statement-breakpoint
ALTER TABLE "locations" RENAME TO "location";--> statement-breakpoint
ALTER TABLE "meeting_packets" RENAME TO "meeting_packet";--> statement-breakpoint
ALTER TABLE "tickets" RENAME TO "ticket";--> statement-breakpoint
ALTER TABLE "timelines" RENAME TO "timeline";--> statement-breakpoint
ALTER TABLE "accounts" RENAME TO "account";--> statement-breakpoint
ALTER TABLE "invitations" RENAME TO "invitation";--> statement-breakpoint
ALTER TABLE "members" RENAME TO "member";--> statement-breakpoint
ALTER TABLE "organizations" RENAME TO "organization";--> statement-breakpoint
ALTER TABLE "sessions" RENAME TO "session";--> statement-breakpoint
ALTER TABLE "teams" RENAME TO "team";--> statement-breakpoint
ALTER TABLE "team_members" RENAME TO "team_member";--> statement-breakpoint
ALTER TABLE "users" RENAME TO "user";--> statement-breakpoint
ALTER TABLE "verifications" RENAME TO "verification";--> statement-breakpoint
ALTER TABLE "organization" DROP CONSTRAINT "organizations_name_unique";--> statement-breakpoint
ALTER TABLE "team" DROP CONSTRAINT "teams_organizationId_name_unique";--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "users_phone_unique";--> statement-breakpoint
ALTER INDEX "account_user_id_idx" RENAME TO "account_userId_idx";--> statement-breakpoint
ALTER INDEX "session_user_id_idx" RENAME TO "session_userId_idx";--> statement-breakpoint
ALTER TABLE "member" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "organization" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "passkey" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "middle_initial";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "address_1";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "address_2";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "city";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "state";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "zip";--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "invitation" ALTER COLUMN "team_id" SET DATA TYPE text USING "team_id"::text;--> statement-breakpoint
ALTER TABLE "member" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "member" ALTER COLUMN "role" SET DATA TYPE text USING "role"::text;--> statement-breakpoint
ALTER TABLE "member" ALTER COLUMN "role" SET DEFAULT 'member';--> statement-breakpoint
ALTER TABLE "member" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "passkey" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "passkey" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "active_organization_id" SET DATA TYPE text USING "active_organization_id"::text;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "active_team_id" SET DATA TYPE text USING "active_team_id"::text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "username" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "first_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "last_name" SET NOT NULL;--> statement-breakpoint
DROP INDEX "locations_org_name_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "locations_org_name_unique" ON "location" ("organization_id",lower(name)) WHERE (organization_id IS NOT NULL);--> statement-breakpoint
DROP INDEX "locations_author_name_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "locations_author_name_unique" ON "location" ("author_user_id",lower(name)) WHERE (organization_id IS NULL);--> statement-breakpoint
ALTER TABLE "team_member" RENAME CONSTRAINT "team_members_membershipKey_unique" TO "team_member_membership_key_key";--> statement-breakpoint
CREATE UNIQUE INDEX "organization_slug_uidx" ON "organization" ("slug");--> statement-breakpoint
ALTER TABLE "booking" DROP CONSTRAINT "end_after_start", ADD CONSTRAINT "end_after_start" CHECK (("end" >= start));