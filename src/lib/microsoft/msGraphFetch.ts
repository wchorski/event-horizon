import { msAuthentication } from "@lib/auth/msAuthentication";

// lib/microsoft/msGraphFetch.ts
const { TENANT_ID, MS_CLIENT_ID, MS_SECRET_VALUE } = import.meta.env;

export async function msGraphFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const accessToken = await msAuthentication(
    TENANT_ID,
    MS_CLIENT_ID,
    MS_SECRET_VALUE,
  );

  // console.log({accessToken});

  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`❌ Microsoft Graph API Error: ${res.status}\n${text}`);
  }

  return text ? JSON.parse(text) : ({} as T);
}
