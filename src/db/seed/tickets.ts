import type { TicketInsert } from "@ty/Schema";

export type TicketSeedInsert = Omit<
  TicketInsert,
  "createdAt" | "updatedAt" | "timestamp"
> & {
  createdAt: string;
  updatedAt: string;
  timestamp: string;
};

// if (!users[0].id)
//   throw new Error(
//     "first user in seed-data should be the admin and should exist",
//   );
// const author_user_id = users[0].id;

const tickets: TicketSeedInsert[] = [
  {
    id: "019f3947-ae0e-7d3e-a2b6-8a503930dc8a",
    userId: "019f392d-8814-76aa-93f6-bd1c6c6bff19",
    eventId: "019f3932-5abf-7d09-ab2e-bd1b64fa3a67",
    timestamp: "2026-03-20T15:00:00.000Z",
    grade: null,
    attended: true,
    createdAt: "2026-03-20T15:00:00.000Z",
    updatedAt: "2026-03-20T15:00:00.000Z",
  },
  {
    id: "019f3947-ae0f-7322-a8d0-ad76d3e9131e",
    userId: "019f392d-8814-76aa-93f6-bd1c6c6bff19",
    eventId: "019f3932-5abf-7d09-ab2e-bd1b64fa3a67",
    timestamp: "2026-03-20T15:00:00.000Z",
    grade: null,
    attended: true,
    createdAt: "2026-03-20T15:00:00.000Z",
    updatedAt: "2026-03-20T15:00:00.000Z",
    
  },
  {
    id: "019f3947-ae0f-7a50-9829-61ebfd7c5613",
    userId: "019f392d-8814-76aa-93f6-bd1c6c6bff19",
    eventId: "019f3932-5abf-7d09-ab2e-bd1b64fa3a67",
    timestamp: "2026-03-20T15:00:00.000Z",
    grade: null,
    attended: true,
    createdAt: "2026-03-20T15:00:00.000Z",
    updatedAt: "2026-03-20T15:00:00.000Z",
    
  },
  {
    id: "019f3947-ae0f-71dc-a19b-efc3d0c2d29e",
    userId: "019f392d-8814-76aa-93f6-bd1c6c6bff19",
    eventId: "019f3932-5abf-7d09-ab2e-bd1b64fa3a67",
    timestamp: "2026-03-20T15:00:00.000Z",
    grade: null,
    attended: true,
    createdAt: "2026-03-20T15:00:00.000Z",
    updatedAt: "2026-03-20T15:00:00.000Z",
    
  },
  {
    id: "019f3947-ae0f-7d9f-8603-089d01860acd",
    userId: "019f392d-8814-76aa-93f6-bd1c6c6bff19",
    eventId: "019f3932-5abf-7d09-ab2e-bd1b64fa3a67",
    timestamp: "2026-03-20T15:00:00.000Z",
    grade: null,
    attended: true,
    createdAt: "2026-03-20T15:00:00.000Z",
    updatedAt: "2026-03-20T15:00:00.000Z",
    
  },
  {
    id: "019f3947-ae0f-7a6b-b925-44d180abaee0",
    userId: "019f392d-8814-76aa-93f6-bd1c6c6bff19",
    eventId: "019f3932-5abf-7d09-ab2e-bd1b64fa3a67",
    timestamp: "2026-03-20T15:00:00.000Z",
    grade: null,
    attended: true,
    createdAt: "2026-03-20T15:00:00.000Z",
    updatedAt: "2026-03-20T15:00:00.000Z",
    
  },
  {
    id: "019f3947-ae0f-790d-996c-82cdf26f06a2",
    userId: "019f392d-8814-76aa-93f6-bd1c6c6bff19",
    eventId: "019f3932-5abf-7d09-ab2e-bd1b64fa3a67",
    timestamp: "2026-03-20T15:00:00.000Z",
    grade: null,
    attended: true,
    createdAt: "2026-03-20T15:00:00.000Z",
    updatedAt: "2026-03-20T15:00:00.000Z",
    
  },
  {
    id: "019f3947-ae0f-7209-b6e9-f6535f547c24",
    userId: "019f392d-8814-76aa-93f6-bd1c6c6bff19",
    eventId: "019f3932-5abf-7d09-ab2e-bd1b64fa3a67",
    timestamp: "2026-03-20T15:00:00.000Z",
    grade: null,
    attended: true,
    createdAt: "2026-03-20T15:00:00.000Z",
    updatedAt: "2026-03-20T15:00:00.000Z",
    
  },
  {
    id: "019f3947-ae0f-7c58-a232-2b250340aeb1",
    userId: "019f392d-8814-76aa-93f6-bd1c6c6bff19",
    eventId: "019f3932-5abf-7d09-ab2e-bd1b64fa3a67",
    timestamp: "2026-03-20T15:00:00.000Z",
    grade: null,
    attended: true,
    createdAt: "2026-03-20T15:00:00.000Z",
    updatedAt: "2026-03-20T15:00:00.000Z",
    
  },
  {
    id: "019f3947-ae0f-7edf-86e6-ea6fd41f72d1",
    userId: "019f392d-8814-76aa-93f6-bd1c6c6bff19",
    eventId: "019f3932-5abf-7d09-ab2e-bd1b64fa3a67",
    timestamp: "2026-03-20T15:00:00.000Z",
    grade: null,
    attended: true,
    createdAt: "2026-03-20T15:00:00.000Z",
    updatedAt: "2026-03-20T15:00:00.000Z",
    
  },
];
export default tickets;
