// src/lib/auth/guards.ts

import { db } from "@db/db";
import { Organization, Member } from "@db/schema";
import { ForbiddenError } from "@lib/errors";
import { and, eq } from "drizzle-orm";

export async function requireOrganizationAccess(
  userId: string,
  organizationSlug: string,
) {
  const organization = await db.query.Organization.findFirst({
    where: eq(Organization.slug, organizationSlug),
  });

  if (!organization) {
    return {
      organization: undefined,
      membership: undefined,
    };
  }

  const membership = await db.query.Member.findFirst({
    where: and(
      eq(Member.userId, userId),
      eq(Member.organizationId, organization.id),
    ),
  });

  return {
    organization,
    membership,
  };
}
