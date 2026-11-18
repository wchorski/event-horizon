// lib/auth/permissions.ts
/**
 * Sure fire check that use is Site Admin (!not related to organization plugin!)
 * @param user 
 * @returns 
 */
export function isSiteAdmin(user: { role?: string | null; banned?: boolean | null }) {
  if (user.banned) return false;
  // better-auth can store multiple roles as "admin,user"
  return (user.role ?? "").split(",").map((r) => r.trim()).includes("admin");
}