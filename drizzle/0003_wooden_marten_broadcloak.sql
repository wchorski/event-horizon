ALTER TABLE "events" ADD COLUMN "outlook_event_id" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "outlook_web_link" text;--> statement-breakpoint
ALTER TABLE "meeting_packets" ADD COLUMN "sharepoint_site_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "meeting_packets" ADD COLUMN "sharepoint_drive_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "meeting_packets" ADD COLUMN "sharepoint_folder_id" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "meeting_packets_folder_unique" ON "meeting_packets" USING btree ("sharepoint_drive_id","sharepoint_folder_id");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_outlook_event_id_unique" UNIQUE("outlook_event_id");