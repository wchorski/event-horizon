// db/seed/accounts.ts
import "dotenv/config";
import type { AccountInsert } from "@ty/Schema";
import users from "./users";

const SECRET = process.env.BETTER_AUTH_SECRET;

const accounts: AccountInsert[] = [
  {
    id: "019f61f7-1a7a-7e13-acaa-69a210abd2cb",
    accountId: "019f61f7-1a7a-7e13-acaa-69a210abd2cb",
    providerId: "credential",
    userId: users[0].id,
    password: users[0].id + SECRET,
    createdAt: new Date(),
    updatedAt: new Date(),
    accessToken: null,
    refreshToken: null,
    idToken: null,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
    scope: null,
  },
  {
    id: "019f66b8-56da-79a6-bc4d-1ae209602240",
    accountId: "019f66b8-56da-79a6-bc4d-1ae209602240",
    providerId: "credential",
    userId: users[1].id,
    password: users[1].id + SECRET,
    createdAt: new Date(),
    updatedAt: new Date(),
    accessToken: null,
    refreshToken: null,
    idToken: null,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
    scope: null,
  },
  {
    id: "019f66b8-8145-7d19-840b-e2e8183a7eba",
    accountId: "019f66b8-8145-7d19-840b-e2e8183a7eba",
    providerId: "credential",
    userId: users[2].id,
    password: users[2].id + SECRET,
    createdAt: new Date(),
    updatedAt: new Date(),
    accessToken: null,
    refreshToken: null,
    idToken: null,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
    scope: null,
  },
];

export default accounts;
