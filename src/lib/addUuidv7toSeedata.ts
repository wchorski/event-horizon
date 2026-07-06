import { uuidv7 } from "@client/uuidv7";
import users from "../db/seed/users";
import roles from "../db/seed/roles";
import locations from "../db/seed/locations";
import events from "../db/seed/events";
import tickets from "../db/seed/tickets";
import { readFile, writeFile } from "node:fs/promises";

async function addonUuidv7ToSeedData() {
  //   const modified = roles.map((item) => ({ ...item, id: uuidv7() }));
  const modified = tickets.map((item) => ({
    ...item,
    id: uuidv7(),
    location_id: "019f3930-2608-77bb-952c-eed3c15fc515",
    event_id: "019f3932-5abf-7d09-ab2e-bd1b64fa3a67",
    user_id: "019f392d-8814-76aa-93f6-bd1c6c6bff19",
    // role_id: "019f392b-fad6-77f5-9b67-db18b9f9fcee",
  }));
  //   write modified to file
  await writeFile(
    "./src/db/seed/tickets-w-uuidv7.json",
    JSON.stringify(modified, null, 2),
    "utf8",
  );
  console.log("seed format complete");
}

addonUuidv7ToSeedData().catch(console.error);
