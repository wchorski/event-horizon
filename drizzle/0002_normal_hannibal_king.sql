ALTER TABLE "bookings" ALTER COLUMN "location_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "end_after_start" CHECK ("bookings"."end" > "bookings"."start");