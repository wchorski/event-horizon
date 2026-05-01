CREATE TYPE "public"."booking_status" AS ENUM('REQUESTED', 'CANCELED', 'DECLINED', 'HOLDING', 'ACCEPTED', 'POSTPONED');--> statement-breakpoint
CREATE TYPE "public"."contractor_role" AS ENUM('PRIMARY', 'ASSISTANT', 'SUPPORT');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"start" timestamp NOT NULL,
	"end" timestamp NOT NULL,
	"notes" text,
	"secret_notes" text,
	"revision" integer DEFAULT 1 NOT NULL,
	"date_created" timestamp DEFAULT now() NOT NULL,
	"date_modified" timestamp DEFAULT now() NOT NULL,
	"google_calendar" json,
	"status" "booking_status" DEFAULT 'REQUESTED' NOT NULL,
	"client_id" uuid,
	"location_id" uuid NOT NULL,
	"event_id" uuid
);
--> statement-breakpoint
CREATE TABLE "booking_contractors" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"booking_id" uuid NOT NULL,
	"contractor_id" uuid NOT NULL,
	"role" "contractor_role" DEFAULT 'PRIMARY',
	"date_assigned" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "host" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "date_created" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "date_modified" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "date_created" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "date_modified" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "date_created" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "date_modified" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_contractors" ADD CONSTRAINT "booking_contractors_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_contractors" ADD CONSTRAINT "booking_contractors_contractor_id_users_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_host_users_id_fk" FOREIGN KEY ("host") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;