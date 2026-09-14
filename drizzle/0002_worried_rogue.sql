CREATE TYPE "public"."meeting_packet_status" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "departments_organization_id_slug_unique" UNIQUE("organization_id","slug")
);
--> statement-breakpoint
CREATE TABLE "meeting_packets" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"event_id" uuid,
	"department_id" uuid NOT NULL,
	"status" "meeting_packet_status" DEFAULT 'DRAFT' NOT NULL,
	"published_file_id" text,
	"published_file_url" text,
	"published_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meeting_packets_event_id_department_id_unique" UNIQUE("event_id","department_id")
);
--> statement-breakpoint
CREATE TABLE "meeting_packet_directories" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"meeting_packet_id" uuid NOT NULL,
	"sharepoint_site_id" text NOT NULL,
	"sharepoint_drive_id" text NOT NULL,
	"sharepoint_folder_id" text NOT NULL,
	"relative_path" text NOT NULL,
	"include_subfolders" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "sharepoint_site_url" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "sharepoint_site_id" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "sharepoint_drive_id" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "sharepoint_library_name" text;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_packets" ADD CONSTRAINT "meeting_packets_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_packets" ADD CONSTRAINT "meeting_packets_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_packet_directories" ADD CONSTRAINT "meeting_packet_directories_meeting_packet_id_meeting_packets_id_fk" FOREIGN KEY ("meeting_packet_id") REFERENCES "public"."meeting_packets"("id") ON DELETE cascade ON UPDATE no action;