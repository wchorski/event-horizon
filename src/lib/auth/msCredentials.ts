// lib/microsoft/getMsCredentials.ts
import { db } from "@db/db";
import { and, eq } from "drizzle-orm";
import { IntegrationCredential } from "@db/schema";
import { decryptSecret } from "@lib/auth/secretBox";

export async function getMsCredentials(organizationId: string) {
  const row = await db.query.IntegrationCredential.findFirst({
    where: and(
      eq(IntegrationCredential.organizationId, organizationId),
      eq(IntegrationCredential.provider, "microsoft"),
    ),
  });

  if (!row)
    throw new Error(
      `No Microsoft credentials configured for org ${organizationId}`,
    );

  const clientSecret = decryptSecret(
    row.secretCiphertext,
    row.secretIv,
    row.secretAuthTag,
  );

  return { tenantId: row.tenantId, clientId: row.clientId, clientSecret };
}
