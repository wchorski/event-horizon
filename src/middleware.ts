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
import { APIError } from "better-auth/api";

const isDev = import.meta.env.DEV;

const publicRoutesPrefixes = [
  //! do not put route path in this list
  // "/",
  "/api/auth",
  "/api/send",
  // TODO what should i do with `/partials/`?
  "/partials/timelines",
  "/partials/bookings",
  "/bookings",
  "/partials/auth",
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
  const headers = context.request.headers;
  const session = await auth.api.getSession({
    headers,
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

  // route path is always public
  const isPublic =
    pathname === "/" ||
    publicRoutesPrefixes.some((route) => pathname.startsWith(route));

  // console.log({user: context.locals.user});

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

  const organizationSlug = pathname.startsWith("/org/") ? pathParts[1] : null;

  // TODO make sure user isn't banned
  //? this is for multi tab org managment (useful now, but may want to revert to commented code below)
  if (organizationSlug && context.locals.user) {
    let organization;
    let member;

    try {
      organization = await auth.api.getOrganization({
        query: { organizationSlug },
        headers,
      })
      // .catch(err => console.log({err}));

      if (organization) {
        const result = await auth.api.listMembers({
          query: {
            organizationId: organization.id,
            filterField: "userId",
            filterOperator: "eq",
            filterValue: context.locals.user.id,
            limit: 1,
          },
          headers,
        });
        member = result?.members?.[0] ?? null;
      }
    } catch (err) {
      // treat API errors (not found / not permitted) like missing data
      // Expected "no access / no such org" responses fall through to the
      // redirects below. Anything else (DB down, bad config, bug) is a real
      // failure and should surface as a 500, not look like a missing org.
      const isExpected =
        err instanceof APIError && [400, 403, 404].includes(err.statusCode);
      if (!isExpected) throw err;
    }

    if (!organization) {
      return context.redirect(
        `/org-not-found?msg=${encodeURIComponent("No organization found for: " + organizationSlug)}`,
      );
    }

    if (!member) {
      return context.redirect(
        `/dashboard?msg=${encodeURIComponent("User is not a member of organization: " + organizationSlug)}`,
      );
    }

    context.locals.organization = organization;
    context.locals.member = member;

    // TODO is this right to trigger here?
    const activeOrgId = context.locals.session?.activeOrganizationId; // wherever you keep the session
    if (activeOrgId !== organization.id) {
      await auth.api.setActiveOrganization({
        body: { organizationId: organization.id },
        headers,
        // TODO do i need this here?
        // returnHeaders: true,
      });
    }
  }

  //? use this only if doing a dynamic active `/org/DYNAMIC` page where only one org can be active at a time
  // if (organizationSlug && context.locals.user) {

  //   const orgActivated = await auth.api.setActiveOrganization({
  //     body: {
  //       // organizationId: "org-id", // The organization ID to set as active. It can be null to unset the active organization.
  //       organizationSlug, // The organization slug to set as active. It can be null to unset the active organization if organizationId is not provided.
  //     },
  //     // This endpoint requires session cookies.
  //     headers,
  //   });

  //   console.log({orgActivated});

  //   const member = await auth.api.getActiveMember({
  //     // This endpoint requires session cookies.
  //     headers,
  //   });

  //   console.log({member});

  //   const org = await auth.api.getOrganization({
  //     query: {
  //       // organizationId: "org-id", // The organization ID to get. By default, it will use the active organization.
  //       organizationSlug, // The organization slug to get.
  //     },
  //     // This endpoint requires session cookies.
  //     headers,
  //   });
  //   console.log("=====> auth.api.getOrganization");
  //   console.log({ org });

  //   if (!org) {
  //     return context.redirect(
  //       `/org-not-found?msg=${encodeURIComponent("No organization found for: " + organizationSlug)}`,
  //     );
  //   }

  //   if (!member || member.organizationId !== org.id) {
  //     return context.redirect(
  //       `/not-authorized?msg=${encodeURIComponent("User is not a member of organization: " + organizationSlug)}`,
  //     );
  //   }

  //   context.locals.organization = org;
  //   context.locals.member = member;
  // }

  return next();
});
