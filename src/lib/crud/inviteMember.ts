// src/lib/crud/inviteMember.ts
import { auth } from "@lib/auth";
import { APIError } from "better-auth/api";
import { FormError } from "@lib/useForm";

const INVITE_ERRORS: Record<string, { message: string; status: number; field?: string }> = {
  USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION: {
    field: "email", status: 409, message: "This person is already a member",
  },
  YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION: {
    status: 403, message: "You don't have permission to invite people",
  },
  // add more as you hit them: log the unmapped `code` from the console
};

export async function inviteMember(
  input: { email: string; role: string; organizationId: string },
  headers: Headers,
) {
  const permission = await auth.api.hasPermission({
    headers,
    body: { organizationId: input.organizationId, permissions: { invitation: ["create"] } },
  });
  if (!permission.success) throw new FormError("You don't have permission to invite people", 403);

  try {
    return await auth.api.createInvitation({
      headers, // session cookies
      body: { ...input, role: input.role as any, resend: true },
    });
  } catch (e) {
    if (e instanceof APIError) {
      const code = (e.body as { code?: string } | undefined)?.code;
      console.warn("invite APIError", code);
      const known = code ? INVITE_ERRORS[code] : undefined;
      if (known) throw new FormError(known.message, known.status, known.field);
    }
    throw e;
  }
}