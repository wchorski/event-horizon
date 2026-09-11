// db/seed/departments.ts
import type {
  MeetingPacketDirectoryInsert,
  MeetingPacketInsert,
} from "@ty/Schema";

export type MeetingPacketDirectorySeedInsert = Omit<
  MeetingPacketDirectoryInsert,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};

const meetingPackets: MeetingPacketDirectorySeedInsert[] = [
  {
    id: "01a091db-b6fa-7125-8c84-1e760bd36504",
    meeting_packet_id: "01a091d2-1226-7f18-8430-30ebc5182b7d",
    relative_path: "MOEITS/2026/09-20",
    sharepoint_folder_id: null,
    include_subfolders: true,
    sort_order: 0,
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
  },
];
export default meetingPackets;
