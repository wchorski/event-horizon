// src/lib/crud/createOrganization.ts
// import type { APIContext } from "astro";
import { auth } from "@lib/auth";
import { APIError } from "better-auth/api";
import { FormError } from "@lib/useForm";
import type { validate } from "@lib/validate";
import type { z } from "astro/zod";
import { columnFromDetail, findDrizzlePgError } from "@lib/errors";

const ORG_UNIQUE: Record<string, { field: string; message: string }> = {
  organizations_name_unique: {
    field: "name",
    message: "An organization with this name already exists",
  },
  organizations_slug_unique: {
    field: "slug",
    message: "That slug is already in use",
  },
};

const ORG_CREATE_ERRORS: Record<
  string,
  { message: string; status: number; field?: string }
> = {
  // use better-auth 'is slug taken' instead
  //   ORGANIZATION_SLUG_ALREADY_TAKEN: {
  //     field: "slug",
  //     status: 409,
  //     message: "That slug is already in use",
  //   },
  ORGANIZATION_ALREADY_EXISTS: {
    field: "slug",
    status: 409,
    message: "That slug is already in use",
  },
  YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_ORGANIZATION: {
    status: 403,
    message: "You don't have permission to create organizations",
  },
  YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_ORGANIZATIONS: {
    status: 403,
    message: "Organization limit reached",
  },
};

export async function createOrganization(
  input: z.output<typeof validate.organizationCreate>,
  //   ctx: Pick<APIContext, "request" | "locals">
  headers: Headers,
) {
  try {
    return await auth.api.createOrganization({
      body: { ...input },
      headers, // session cookies; the creator is derived from them
    });
  } catch (e) {
    const pg = findDrizzlePgError(e);
    if (pg?.code === "23505") {
      const hit = ORG_UNIQUE[pg.constraint ?? ""];
      const field = hit?.field ?? columnFromDetail(pg.detail);
      throw new FormError(
        hit?.message ?? "That value is already in use",
        409,
        field,
      );
    }
    if (e instanceof APIError) {
      const code = (e.body as { code?: string } | undefined)?.code;
      const known = code ? ORG_CREATE_ERRORS[code] : undefined;
      console.log({ code, known });
      if (known) throw new FormError(known.message, known.status, known.field);
    }
    throw e;
  }
}
