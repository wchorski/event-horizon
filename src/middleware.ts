// src/middleware.ts
import { auth } from "@lib/auth";
import { Organization, Member } from "@db/schema";
import { defineMiddleware } from "astro:middleware";
import {
  UMAMI_HOST_URL,
  UMAMI_PROXY_PREFIX,
  UMAMI_SCRIPT,
} from "astro:env/client";
import { db } from "@db/db";
import { and, eq } from "drizzle-orm";

const isDev = import.meta.env.DEV;

const publicRoutesPrefixes = [
  "/",
  "/api/auth",
  "/api/send",
  // TODO what should i do with `/partials/`?
  "/partials/timelines/",
  "/partials/bookings/",
  "/partials/auth/",
  // "/partials/",
  "/login",
  "/sign-up",
  "/sign-out",
  "/password-reset",
  "/not-authorized",
  "/org-not-found",
  "/bye-bye-bye",
  "/accept-invitation",
  "/forgot-password",
  "/org-not-found",
  "/not-authorized",
  "/bye-bye-bye",
  // "/accept-invitation",
  "/timelines",
  `${UMAMI_PROXY_PREFIX}/api/send`,
];

const ROUTE_MAP: Record<string, string> = {
  [UMAMI_PROXY_PREFIX]: `/${UMAMI_SCRIPT}`, // script
  [`${UMAMI_PROXY_PREFIX}/api/send`]: "/api/send", // data collection
};

export const onRequest = defineMiddleware(async (context, next) => {
  const session = await auth.api.getSession({
    headers: context.request.headers,
  });

  context.locals.user = session?.user ?? null;
  context.locals.session = session?.session ?? null;
  context.locals.organization = null;
  context.locals.member = null;

  const pathname = context.url.pathname;
  const pathParts = pathname.split("/").filter(Boolean);

  // this handled with better-auth "allowUserToCreateOrganization"
  // if (pathname.startsWith("/api/auth/organization/")) {
  //   // only site admins may create orgs or mutate membership
  //   if (context.locals.user?.role !== "admin") {
  //     return new Response("Forbidden", { status: 403 });
  //   }
  // }

  // analytics proxy — bypasses auth/org gating entirely, same as before
  if (!isDev) {
    const remotePath = ROUTE_MAP[pathname];

    if (remotePath && UMAMI_HOST_URL) {
      const targetUrl = `${UMAMI_HOST_URL}${remotePath}${context.url.search}`;
      const isBodyMethod = !["GET", "HEAD"].includes(context.request.method);

      const res = await fetch(targetUrl, {
        method: context.request.method,
        headers: {
          "content-type":
            context.request.headers.get("content-type") ?? "application/json",
          "user-agent": context.request.headers.get("user-agent") ?? "",
          "x-forwarded-for":
            context.request.headers.get("x-forwarded-for") ??
            context.clientAddress ??
            "",
        },
        body: isBodyMethod ? context.request.body : undefined,
        // @ts-ignore — required by undici for streaming request bodies
        duplex: isBodyMethod ? "half" : undefined,
      });

      const body = await res.arrayBuffer();
      return new Response(body, {
        status: res.status,
        headers: {
          "content-type":
            res.headers.get("content-type") ?? "application/javascript",
          "cache-control": res.headers
            .get("content-type")
            ?.includes("javascript")
            ? "public, max-age=3600"
            : "no-store",
        },
      });
    }
  }

  const organizationSlug = pathname.startsWith("/org/") ? pathParts[1] : null;

  const isPublic = publicRoutesPrefixes.some((route) =>
    pathname.startsWith(route),
  );

  if (!isPublic && !context.locals.user) {
    return context.redirect(
      `/login?returnTo=${encodeURIComponent(
        context.url.pathname + context.url.search,
      )}&msg=${encodeURIComponent("Unauthorized. Please login to be returned back to the previous page")}`,
    );
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (context.locals.user?.role !== "admin") {
      return context.redirect(
        `/not-authorized?msg=${encodeURIComponent("Site admin access required")}`,
      );
    }
  }

  if (organizationSlug && context.locals.user) {
    const [row] = await db
      .select({ organization: Organization, member: Member })
      .from(Organization)
      .leftJoin(
        Member,
        and(
          eq(Member.organizationId, Organization.id),
          eq(Member.userId, context.locals.user.id),
        ),
      )
      .where(eq(Organization.slug, organizationSlug))
      .limit(1);

    if (!row) {
      return context.redirect(
        `/org-not-found?msg=${encodeURIComponent("No organization found for: " + organizationSlug)}`,
      );
    }

    if (!row.member) {
      return context.redirect(
        `/not-authorized?msg=${encodeURIComponent("User is not a member of organization: " + organizationSlug)}`,
      );
    }

    context.locals.organization = row.organization;
    context.locals.member = row.member;
  }

  return next();
});
