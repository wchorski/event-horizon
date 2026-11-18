CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"membership_key" text,
	"created_at" timestamp,
	CONSTRAINT "team_members_membershipKey_unique" UNIQUE("membership_key")
);
--> statement-breakpoint
ALTER TABLE "roles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE IF EXISTS "roles" CASCADE;--> statement-breakpoint
ALTER TABLE "locations" DROP CONSTRAINT "locations_name_unique";--> statement-breakpoint
ALTER TABLE "booking_assignments" DROP CONSTRAINT IF EXISTS "booking_assignments_role_id_roles_id_fk";
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_role_id_roles_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "users_role_id_idx";--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "team_id" uuid;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "active_team_id" uuid;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_organizationId_idx" ON "teams" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "teamMember_teamId_idx" ON "team_members" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "teamMember_userId_idx" ON "team_members" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "booking_assignments" DROP COLUMN IF EXISTS "role_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "role_id";--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_organization_id_name_unique" UNIQUE NULLS NOT DISTINCT("organization_id","name");