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

  if (!res.ok) throw new GraphApiError(res.status, text);

  if (!text) {
    // Some Graph calls (e.g. certain PATCH/DELETE) return 204 No Content.
    return undefined as T;
  }

  return text ? JSON.parse(text) : ({} as T);
}

// src/lib/microsoft/msGraphFetch.ts

export class GraphApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, body: string) {
    super(`❌ Microsoft Graph API Error: ${status}\n${body}`);
    this.status = status;
    try {
      this.code = JSON.parse(body)?.error?.code;
    } catch {
      // body wasn't JSON — leave code undefined
    }
  }
}
