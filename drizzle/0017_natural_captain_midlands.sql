CREATE TYPE "public"."booking_client_role" AS ENUM('client');--> statement-breakpoint
CREATE TYPE "public"."booking_client_status" AS ENUM('invited', 'accepted', 'declined');--> statement-breakpoint
CREATE TABLE "booking_clients" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"booking_id" uuid NOT NULL,
	"email" text NOT NULL,
	"user_id" uuid,
	"role" "booking_client_role" DEFAULT 'client' NOT NULL,
	"status" "booking_client_status" DEFAULT 'invited' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"claimed_at" timestamp,
	CONSTRAINT "booking_clients_booking_email_role_unique" UNIQUE("booking_id","email","role")
);
--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_client_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_clients" ADD CONSTRAINT "booking_clients_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_clients" ADD CONSTRAINT "booking_clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_clients_user_idx" ON "booking_clients" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "booking_clients_email_idx" ON "booking_clients" USING btree ("email");--> statement-breakpoint
CREATE INDEX "booking_clients_booking_idx" ON "booking_clients" USING btree ("booking_id");--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "client_id";