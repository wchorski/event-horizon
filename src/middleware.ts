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

  const exactPublicRoutes = new Set([
    "/",
    "/login",
    "/sign-up",
    "/sign-out",
    "/not-authorized",
    "/org-not-found",
    "/bye-bye-bye",
    "/forgot-password",
    "/timelines",
    // TODO lock down with auth later
    "/bookings",
  ]);
  const publicPrefixes = [
    "/api/auth",
    "/api/send",
    // TODO what should i do with `/partials/`?
    "/partials/timelines/",
    "/partials/bookings/",
    // "/partials/",
    `${UMAMI_PROXY_PREFIX}/api/send`,
  ];

  const isPublic =
    exactPublicRoutes.has(pathname) ||
    publicPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!isPublic && !context.locals.user) {
    return context.redirect(
      `/login?returnTo=${encodeURIComponent(
        context.url.pathname + context.url.search,
      )}&msg=${encodeURIComponent("Unauthorized. Please login to be returned back to the previous page")}`,
    );
  }

  const RESERVED_ROUTE_SLUGS = new Set([
    "login",
    "sign-up",
    "sign-out",
    "not-authorized",
    "org-not-found",
    "bye-bye-bye",
    "forgot-password",
    "timelines",
    "bookings",
    "api",
    "assets",
    "_astro",
  ]);

  const organizationSlug = pathParts[0];
  const isOrgCandidate =
    organizationSlug && !RESERVED_ROUTE_SLUGS.has(organizationSlug);

  if (isOrgCandidate && context.locals.user && !isPublic) {
    const organization = await db.query.Organization.findFirst({
      where: eq(Organization.slug, organizationSlug),
    });

    if (!organization) {
      return context.redirect(
        `/org-not-found?msg=${encodeURIComponent("No organization found for: " + organizationSlug)}`,
      );
    }

    const member = await db.query.Member.findFirst({
      where: and(
        eq(Member.userId, context.locals.user.id),
        eq(Member.organizationId, organization.id),
      ),
    });

    if (!member) {
      return context.redirect(
        `/not-authorized?msg=${encodeURIComponent("User is not a member of organization: " + organizationSlug)}`,
      );
    }

    context.locals.organization = organization;
    context.locals.member = member;
  }

  return next();
});
