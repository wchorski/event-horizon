// src/lib/auth/respond.ts
export function authRedirect(
  request: Request,
  location: string,
  setCookies: string[] = [],
) {
  const headers = new Headers();
  for (const c of setCookies) headers.append("Set-Cookie", c);

  if (request.headers.get("HX-Request") === "true") {
    headers.set("HX-Redirect", location); // full page load, so session-aware layout refreshes
    return new Response(null, { status: 204, headers });
  }
  headers.set("Location", location);
  return new Response(null, { status: 302, headers });
}