import { defineMiddleware } from "astro:middleware";

const UMAMI_HOST = import.meta.env.UMAMI_HOST
export const UMAMI_PROXY_PREFIX = "/assets/ramen";

export const onRequest = defineMiddleware(async (context, next) => {
  // Skip proxying entirely in dev — let requests go straight through
  // (or just don't fire analytics locally at all)
  if (import.meta.env.DEV) {
    return next();
  }

  const url = new URL(context.request.url);

  if (url.pathname.startsWith(UMAMI_PROXY_PREFIX)) {
    const remotePath = url.pathname.slice(UMAMI_PROXY_PREFIX.length) || "/";
    const targetUrl = `${UMAMI_HOST}${remotePath}${url.search}`;

    const isBodyMethod = !["GET", "HEAD"].includes(context.request.method);

    const res = await fetch(targetUrl, {
      method: context.request.method,
      headers: {
        "content-type": context.request.headers.get("content-type") ?? "application/json",
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
        "content-type": res.headers.get("content-type") ?? "application/javascript",
        "cache-control": res.headers.get("content-type")?.includes("javascript")
          ? "public, max-age=3600"
          : "no-store",
      },
    });
  }

  return next();
});