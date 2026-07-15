// src/pages/api/dev/quick-switch.ts
import type { APIRoute } from "astro";
import { login } from "@lib/auth/login";
import users from "@db/seed/users";
import accounts from "@db/seed/accounts";
import { auth } from "@lib/auth";

const { BETTER_AUTH_SECRET } = import.meta.env;

export const POST: APIRoute = async ({ request }) => {

  if (!import.meta.env.DEV) {
    return new Response(null, { status: 404 });
  }

  const formData = await request.formData();
  const email = formData.get("auth_email")?.toString() ?? "";

  if (email === "") {
    const result = await auth.api.signOut({
      headers: request.headers,
      asResponse: true,
    });

    const res = new Response(`<p class="info">signed out and anonymous</p>`, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "HX-Refresh": "true",
      },
    });

    const setCookies = result.headers.getSetCookie?.() ?? [];
    for (const cookie of setCookies) {
      res.headers.append("set-cookie", cookie);
    }
    return res;
  }

  const seedUser = users.find((u) => u.email === email);

  if (!seedUser) {
    return new Response(`<p class="error">Unknown dev user.</p>`, {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const account = accounts.find((a) => a.userId === seedUser.id);

  if (!account || !account.password) {
    return new Response(
      `<p class="error">no account found (or no password set)</p>`,
      {
        status: 400,
        headers: { "Content-Type": "text/html" },
      },
    );
  }

  const result = await login({
    email,
    password: seedUser.id + BETTER_AUTH_SECRET,
  });

  if (!result.success) {
    return new Response(`<p class="error">${result.error}</p>`, {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const res = new Response("", {
    status: 200,
    headers: {
      "Content-Type": "text/html",
      "HX-Refresh": "true", // tells htmx to do a full page reload
    },
  });
  for (const cookie of result.setCookies) {
    res.headers.append("set-cookie", cookie);
  }
  return res;
};
