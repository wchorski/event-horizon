ALTER TABLE "passkeys" RENAME TO "passkey";--> statement-breakpoint
ALTER TABLE "bookings" RENAME COLUMN "date_created" TO "created_at";--> statement-breakpoint
ALTER TABLE "bookings" RENAME COLUMN "date_modified" TO "updated_at";--> statement-breakpoint
ALTER TABLE "events" RENAME COLUMN "date_created" TO "created_at";--> statement-breakpoint
ALTER TABLE "events" RENAME COLUMN "date_modified" TO "updated_at";--> statement-breakpoint
ALTER TABLE "organizations" RENAME COLUMN "date_created" TO "created_at";--> statement-breakpoint
ALTER TABLE "organizations" RENAME COLUMN "date_modified" TO "updated_at";--> statement-breakpoint
ALTER TABLE "sessions" RENAME COLUMN "date_created" TO "created_at";--> statement-breakpoint
ALTER TABLE "sessions" RENAME COLUMN "date_modified" TO "updated_at";--> statement-breakpoint
ALTER TABLE "tickets" RENAME COLUMN "date_created" TO "created_at";--> statement-breakpoint
ALTER TABLE "tickets" RENAME COLUMN "date_modified" TO "updated_at";--> statement-breakpoint
ALTER TABLE "timelines" RENAME COLUMN "date_created" TO "created_at";--> statement-breakpoint
ALTER TABLE "timelines" RENAME COLUMN "date_modified" TO "updated_at";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "image_url" TO "image";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "date_created" TO "created_at";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "date_modified" TO "updated_at";--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "end_after_start";--> statement-breakpoint
ALTER TABLE "passkey" DROP CONSTRAINT "passkeys_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "first_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "address_1" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "city" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "state" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "zip" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "display_username" text;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "end_after_start" CHECK ("bookings"."end" >= "bookings"."start");