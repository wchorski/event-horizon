CREATE TYPE "location_type" AS ENUM('PUBLIC', 'PRIVATE');--> statement-breakpoint
ALTER TABLE "location" ADD COLUMN "private" boolean DEFAULT true;