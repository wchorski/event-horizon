CREATE TYPE "booking_client_role" AS ENUM('client');--> statement-breakpoint
CREATE TYPE "booking_client_status" AS ENUM('invited', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "booking_status" AS ENUM('REQUESTED', 'CANCELED', 'DECLINED', 'HOLDING', 'ACCEPTED', 'POSTPONED');--> statement-breakpoint
CREATE TYPE "integration_provider" AS ENUM('microsoft', 'google');--> statement-breakpoint
CREATE TYPE "location_type" AS ENUM('PUBLIC', 'PRIVATE');--> statement-breakpoint
CREATE TYPE "meeting_packet_status" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TABLE "booking" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"start" timestamp NOT NULL,
	"end" timestamp NOT NULL,
	"notes" text,
	"secret_notes" text,
	"revision" integer DEFAULT 1 NOT NULL,
	"google_calendar" jsonb,
	"status" "booking_status" DEFAULT 'REQUESTED'::"booking_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"author_user_id" uuid NOT NULL,
	"location_id" uuid,
	"event_id" uuid,
	"organization_id" uuid,
	CONSTRAINT "end_after_start" CHECK (("end" >= start))
);
--> statement-breakpoint
ALTER TABLE "booking" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "booking_assignment" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"booking_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"date_assigned" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "booking_assignments_booking_id_user_id_unique" UNIQUE("booking_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "booking_client" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"booking_id" uuid NOT NULL,
	"email" text NOT NULL,
	"user_id" uuid,
	"role" "booking_client_role" DEFAULT 'client'::"booking_client_role" NOT NULL,
	"status" "booking_client_status" DEFAULT 'invited'::"booking_client_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"claimed_at" timestamp,
	CONSTRAINT "booking_clients_booking_email_role_unique" UNIQUE("booking_id","email","role")
);
--> statement-breakpoint
ALTER TABLE "booking_client" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "event" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"wp_post_id" integer CONSTRAINT "events_wp_post_id_unique" UNIQUE,
	"subject" text NOT NULL,
	"excerpt" text,
	"where" text,
	"timestamp" timestamp NOT NULL,
	"date_civil" text NOT NULL,
	"location_id" uuid NOT NULL,
	"organization_id" uuid,
	"author_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"outlook_event_id" text CONSTRAINT "events_outlook_event_id_unique" UNIQUE,
	"outlook_web_link" text
);
--> statement-breakpoint
CREATE TABLE "event_host" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"date_assigned" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_hosts_event_id_user_id_unique" UNIQUE("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "integration_credential" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"tenant_id" text NOT NULL,
	"client_id" text NOT NULL,
	"secret_ciphertext" text NOT NULL,
	"secret_iv" text NOT NULL,
	"secret_auth_tag" text NOT NULL,
	"key_version" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp,
	"rotated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "integration_credentials_organizationId_provider_unique" UNIQUE("organization_id","provider")
);
--> statement-breakpoint
CREATE TABLE "location" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip" text NOT NULL,
	"timezone" text NOT NULL,
	"excerpt" text,
	"private" boolean DEFAULT true NOT NULL,
	"author_user_id" uuid NOT NULL,
	"organization_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "location" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "meeting_packet" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"event_id" uuid,
	"status" "meeting_packet_status" DEFAULT 'DRAFT'::"meeting_packet_status" NOT NULL,
	"published_file_id" text,
	"published_file_url" text,
	"published_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"sharepoint_folder_id" text NOT NULL,
	"outlook_event_id" text,
	"outlook_web_link" text
);
--> statement-breakpoint
CREATE TABLE "ticket" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"user_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"timestamp" timestamp NOT NULL,
	"grade" text,
	"attended" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"booking_id" uuid CONSTRAINT "timelines_booking_id_unique" UNIQUE,
	"owner_user_id" uuid,
	"rev" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"timestamp" timestamp NOT NULL,
	"date_civil" text NOT NULL,
	"notes" text,
	"secret_notes" text,
	"color" text,
	"summary" text,
	"timezone" text,
	"start" integer NOT NULL,
	"end" integer NOT NULL,
	"data" jsonb
);
--> statement-breakpoint
ALTER TABLE "timeline" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"team_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"inviter_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	"color" text,
	"color_2" text,
	"mailbox_user_email" text,
	"sharepoint_site_url" text,
	"sharepoint_site_id" text,
	"sharepoint_drive_id" text,
	"sharepoint_library_name" text,
	"dedicated_db_url" text
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" text,
	"public_key" text NOT NULL,
	"user_id" uuid NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp,
	"aaguid" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"impersonated_by" text,
	"active_organization_id" text,
	"active_team_id" text
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" text NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "team_member" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"membership_key" text UNIQUE,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"username" text UNIQUE,
	"display_username" text,
	"phone" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"middle_initial" text
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "bookings_author_idx" ON "booking" ("author_user_id");--> statement-breakpoint
CREATE INDEX "booking_clients_booking_idx" ON "booking_client" ("booking_id");--> statement-breakpoint
CREATE INDEX "booking_clients_email_idx" ON "booking_client" ("email");--> statement-breakpoint
CREATE INDEX "booking_clients_user_idx" ON "booking_client" ("user_id");--> statement-breakpoint
CREATE INDEX "events_location_id_idx" ON "event" ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "events_subject_date_location_unique" ON "event" ("subject","date_civil","location_id");--> statement-breakpoint
CREATE INDEX "integration_credentials_org_idx" ON "integration_credential" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_author_name_unique" ON "location" ("author_user_id",lower(name)) WHERE (organization_id IS NULL);--> statement-breakpoint
CREATE INDEX "locations_city_idx" ON "location" ("city");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_org_name_unique" ON "location" ("organization_id",lower(name)) WHERE (organization_id IS NOT NULL);--> statement-breakpoint
CREATE INDEX "locations_state_idx" ON "location" ("state");--> statement-breakpoint
CREATE INDEX "locations_author_idx" ON "location" ("author_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "meeting_packets_folder_unique" ON "meeting_packet" ("sharepoint_folder_id");--> statement-breakpoint
CREATE INDEX "tickets_event_id_idx" ON "ticket" ("event_id");--> statement-breakpoint
CREATE INDEX "tickets_user_id_idx" ON "ticket" ("user_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "invitation_organizationId_idx" ON "invitation" ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" ("email");--> statement-breakpoint
CREATE INDEX "member_organizationId_idx" ON "member" ("organization_id");--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "member" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_slug_uidx" ON "organization" ("slug");--> statement-breakpoint
CREATE INDEX "passkey_userId_idx" ON "passkey" ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_credentialID_idx" ON "passkey" ("credential_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "team_organizationId_idx" ON "team" ("organization_id");--> statement-breakpoint
CREATE INDEX "teamMember_teamId_idx" ON "team_member" ("team_id");--> statement-breakpoint
CREATE INDEX "teamMember_userId_idx" ON "team_member" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_author_user_id_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_location_id_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id");--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_event_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id");--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "booking_assignment" ADD CONSTRAINT "booking_assignment_booking_id_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "booking_assignment" ADD CONSTRAINT "booking_assignment_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "booking_client" ADD CONSTRAINT "booking_client_booking_id_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "booking_client" ADD CONSTRAINT "booking_client_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_location_id_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id");--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_author_user_id_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "event_host" ADD CONSTRAINT "event_host_event_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_host" ADD CONSTRAINT "event_host_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "integration_credential" ADD CONSTRAINT "integration_credential_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "location" ADD CONSTRAINT "location_author_user_id_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "location" ADD CONSTRAINT "location_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "meeting_packet" ADD CONSTRAINT "meeting_packet_event_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_event_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id");--> statement-breakpoint
ALTER TABLE "timeline" ADD CONSTRAINT "timeline_booking_id_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "timeline" ADD CONSTRAINT "timeline_owner_user_id_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "booking_admin" ON "booking" AS PERMISSIVE FOR ALL TO "app_user" USING ((select coalesce(current_setting('app.is_admin', true), '') = 'true')) WITH CHECK ((select coalesce(current_setting('app.is_admin', true), '') = 'true'));--> statement-breakpoint
CREATE POLICY "booking_author" ON "booking" AS PERMISSIVE FOR ALL TO "app_user" USING ("booking"."author_user_id" = (select nullif(current_setting('app.user_id', true), '')::uuid)) WITH CHECK ("booking"."author_user_id" = (select nullif(current_setting('app.user_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "booking_read" ON "booking" AS PERMISSIVE FOR SELECT TO "app_user" USING ("booking"."author_user_id" = (select nullif(current_setting('app.user_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "booking_not_banned" ON "booking" AS RESTRICTIVE FOR ALL TO "app_user" USING (
      NOT EXISTS (
        SELECT 1
        FROM public."user"
        WHERE id = (select nullif(current_setting('app.user_id', true), '')::uuid)
        AND banned = true
      )
    );--> statement-breakpoint
CREATE POLICY "booking_client_admin" ON "booking_client" AS PERMISSIVE FOR ALL TO "app_user" USING ((select coalesce(current_setting('app.is_admin', true), '') = 'true')) WITH CHECK ((select coalesce(current_setting('app.is_admin', true), '') = 'true'));--> statement-breakpoint
CREATE POLICY "booking_client_read" ON "booking_client" AS PERMISSIVE FOR SELECT TO "app_user" USING ("booking_client"."user_id" = (select nullif(current_setting('app.user_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "booking_clients_not_banned" ON "booking_client" AS RESTRICTIVE FOR ALL TO "app_user" USING (
      NOT EXISTS (
        SELECT 1
        FROM public."user"
        WHERE id = (select nullif(current_setting('app.user_id', true), '')::uuid)
        AND banned = true
      )
    );--> statement-breakpoint
CREATE POLICY "location_admin" ON "location" AS PERMISSIVE FOR ALL TO "app_user" USING ((select coalesce(current_setting('app.is_admin', true), '') = 'true')) WITH CHECK ((select coalesce(current_setting('app.is_admin', true), '') = 'true'));--> statement-breakpoint
CREATE POLICY "location_read" ON "location" AS PERMISSIVE FOR SELECT TO "app_user" USING ("location"."private" = false or "location"."author_user_id" = (select nullif(current_setting('app.user_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "location_write" ON "location" AS PERMISSIVE FOR ALL TO "app_user" USING ("location"."author_user_id" = (select nullif(current_setting('app.user_id', true), '')::uuid)) WITH CHECK ("location"."author_user_id" = (select nullif(current_setting('app.user_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "location_not_banned" ON "location" AS RESTRICTIVE FOR ALL TO "app_user" USING (
      NOT EXISTS (
        SELECT 1
        FROM public."user"
        WHERE id = (select nullif(current_setting('app.user_id', true), '')::uuid)
        AND banned = true
      )
    );