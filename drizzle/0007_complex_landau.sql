CREATE TYPE "public"."integration_provider" AS ENUM('microsoft', 'google');--> statement-breakpoint
CREATE TABLE "integration_credentials" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"tenant_id" text NOT NULL,
	"client_id" text NOT NULL,
	"encrypted_client_secret" text NOT NULL,
	"encryption_iv" text NOT NULL,
	"encryption_auth_tag" text NOT NULL,
	"key_version" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp,
	"rotated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "integration_credentials_organizationId_provider_unique" UNIQUE("organization_id","provider")
);
--> statement-breakpoint
ALTER TABLE "integration_credentials" ADD CONSTRAINT "integration_credentials_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "integration_credentials_org_idx" ON "integration_credentials" USING btree ("organization_id");