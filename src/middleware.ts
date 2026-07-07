import { defineMiddleware } from "astro:middleware";

const UMAMI_HOST = "https://soup.tawtaw.site";
const REMOTE_PATH = "/ramen";
export const UMAMI_PROXY_PREFIX = "/assets/ramen";

export const onRequest = defineMiddleware(async (context, next) => {
  if (import.meta.env.DEV) {
    return next();
  }

  const url = new URL(context.request.url);

  if (url.pathname === UMAMI_PROXY_PREFIX) {
    const targetUrl = `${UMAMI_HOST}${REMOTE_PATH}${url.search}`;
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
