// src/middleware.ts
import { auth } from "@lib/auth";
import { defineMiddleware } from "astro:middleware";
import { UMAMI_HOST_URL, UMAMI_PROXY_PREFIX, UMAMI_SCRIPT } from "astro:env/client";

const isDev = import.meta.env.DEV;

const ROUTE_MAP: Record<string, string> = {
  [UMAMI_PROXY_PREFIX]: `/${UMAMI_SCRIPT}`, // script
  [`${UMAMI_PROXY_PREFIX}/api/send`]: "/api/send", // data collection
};

export const onRequest = defineMiddleware(async (context, next) => {
  const isAuthed = await auth.api.getSession({
    headers: context.request.headers,
  });

  if (isAuthed) {
    context.locals.user = isAuthed.user;
    context.locals.session = isAuthed.session;
  } else {
    context.locals.user = null;
    context.locals.session = null;
  }

  // skip analytics if on dev
  if (isDev) {
    return next();
  }

  const url = new URL(context.request.url);
  const remotePath = ROUTE_MAP[url.pathname];

  if (remotePath && UMAMI_HOST_URL) {
    const targetUrl = `${UMAMI_HOST_URL}${remotePath}${url.search}`;
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
        "cache-control": res.headers.get("content-type")?.includes("javascript")
          ? "public, max-age=3600"
          : "no-store",
      },
    });
  }

  return next();
});
