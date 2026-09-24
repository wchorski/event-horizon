// src/middleware.ts
import { auth } from "@lib/auth";
import { defineMiddleware } from "astro:middleware";
import {
  UMAMI_HOST_URL,
  UMAMI_PROXY_PREFIX,
  UMAMI_SCRIPT,
} from "astro:env/client";

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

  const publicRoutes = ["/login", "/sign-up", "/forgot-password"];
  const isPublic = publicRoutes.some((route) => context.url.pathname.startsWith(route));

  if (!isPublic && !context.locals.user) {
    return context.redirect(
      `/login?returnTo=${encodeURIComponent(
        context.url.pathname + context.url.search,
      )}&msg=${encodeURIComponent("Unauthorized. Please login to be returned back to the previous page")}`,
    );
  }
  //? all routes are protected unless made open (above)
  // const protectedRoutes = [
  //   "/documents",
  //   "/admin",
  //   "/dashboard",
  //   "/partials/events",
  //   "/partials/users",
  //   "/partials/organizations",
  //   "/partials/organizations",
  //   "/partials/tickets",
  // ];

  // const requiresAuth = protectedRoutes.some((route) =>
  //   context.url.pathname.startsWith(route),
  // );

  // if (requiresAuth && !context.locals.user) {
  //   return context.redirect(
  //     `/login?returnTo=${encodeURIComponent(
  //       context.url.pathname + context.url.search,
  //     )}&msg=${encodeURIComponent("Unauthorized. Please login to be returned back to the previous page")}`,
  //   );
  // }

  if (isDev) {
    return next();
  }

  return next();
});
