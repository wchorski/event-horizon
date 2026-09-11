// db/seed/departments.ts
import type { MeetingPacketInsert } from "@ty/Schema";

export type MeetingPacketsSeedInsert = Omit<
  MeetingPacketInsert,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};

const meetingPackets: MeetingPacketsSeedInsert[] = [
  {
    id: "01a091d2-1226-7f18-8430-30ebc5182b7d",
    event_id: "01a091d4-9cac-7938-bb39-1b8eb4626a5e",
    department_id: "01a091b4-b532-7b9b-9fee-95b4ad19ca0b",
    status: "DRAFT",
    notes: "September 2026 Finance packet",
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
  },
//   {
//     id: "01a091d2-3671-7299-bb86-ad1015cdeabc",
//   }
//   {
//     id: "01a091d2-38bd-7cb8-9b63-7e971ab97933",
//   }
];
export default meetingPackets;
