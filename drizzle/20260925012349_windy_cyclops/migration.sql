ALTER TABLE "integration_credentials" RENAME COLUMN "encrypted_client_secret" TO "secret_ciphertext";--> statement-breakpoint
ALTER TABLE "integration_credentials" RENAME COLUMN "encryption_iv" TO "secret_iv";--> statement-breakpoint
ALTER TABLE "integration_credentials" RENAME COLUMN "encryption_auth_tag" TO "secret_auth_tag";