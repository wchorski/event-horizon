// src/pages/api/auth/[...all].ts
// credit - https://www.giorgiosaud.io/notebook/better-auth-drizzle-neon-astro
import type { APIRoute } from "astro";
import { auth } from "@lib/auth";

export const ALL: APIRoute = async (ctx) => {
	// If you want to use rate limiting, make sure to set the 'x-forwarded-for' header to the request headers from the context
	// ctx.request.headers.set("x-forwarded-for", ctx.clientAddress);
	return auth.handler(ctx.request);
};

//? OAuth endpoints
// https://yourdomain.com/api/auth/callback/<provider>
// http://localhost:4321/api/auth/callback/github
// http://localhost:4321/api/auth/callback/google
// http://localhost:4321/api/auth/callback/facebook

//? Passkey
// dev:  rpID = 'localhost',        origin = 'http://localhost:4321'
// prod: rpID = 'yourdomain.com',   origin = 'https://yourdomain.com'