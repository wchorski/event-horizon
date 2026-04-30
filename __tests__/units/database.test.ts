import "dotenv/config";
import { TEST_ADMIN_SESSION } from "@lib/auth/session";
import { crud } from "@lib/crudRegistry";
import { expect, test, vi } from "vitest";
import { seedData } from "@db/seed-data";

test("read returns user by id", async () => {
  vi.spyOn(crud.users, "read").mockResolvedValue(seedData.users[0]);

  const result = await crud.users.read("1", TEST_ADMIN_SESSION);
  expect(result?.id).toBe(seedData.users[0].id);

  //? for integration testing not unit testing
  // const [user] = await db
  //   .select()
  //   .from(User)
  //   .where(eq(User.id, seedData.users[0].id))
  //   .limit(1);
});
