ALTER TABLE "meeting_packets" DROP CONSTRAINT "meeting_packets_event_id_department_id_unique";--> statement-breakpoint
ALTER TABLE "meeting_packets" DROP CONSTRAINT "meeting_packets_department_id_departments_id_fk";--> statement-breakpoint
ALTER TABLE "departments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "meeting_packet_directories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "departments" CASCADE;--> statement-breakpoint
DROP TABLE "meeting_packet_directories" CASCADE;--> statement-breakpoint
--> statement-breakpoint
DROP INDEX "meeting_packets_folder_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "meeting_packets_folder_unique" ON "meeting_packets" USING btree ("sharepoint_folder_id");--> statement-breakpoint
ALTER TABLE "meeting_packets" DROP COLUMN "department_id";--> statement-breakpoint
ALTER TABLE "meeting_packets" DROP COLUMN "sharepoint_site_id";--> statement-breakpoint
ALTER TABLE "meeting_packets" DROP COLUMN "sharepoint_drive_id";