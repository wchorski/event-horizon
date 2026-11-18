ALTER TABLE "locations" DROP CONSTRAINT IF EXISTS "locations_organization_id_name_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "locations_org_name_unique";
DROP INDEX IF EXISTS "locations_author_name_unique";
CREATE UNIQUE INDEX "locations_org_name_unique" ON "locations" USING btree ("organization_id",lower("name")) WHERE "locations"."organization_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "locations_author_name_unique" ON "locations" USING btree ("author_user_id",lower("name")) WHERE "locations"."organization_id" is null;