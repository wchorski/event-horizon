import { PERMISSIONS } from "@lib/auth/roles";

export default [
  {
    id: "00000000-0000-0000-0000-000000000001",
    label: "admin",
    excerpt: "Permission to create/read/update/delete all data",
    permissions: Object.values(PERMISSIONS), // admin gets everything
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    label: "host",
    excerpt:
      "Permission to create/read/update/delete all users, events, locations, & tickets",
    permissions: [
      PERMISSIONS.viewAllUsers,
      PERMISSIONS.manageAllEvents,
      PERMISSIONS.viewAllTickets,
    ],
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    label: "worker",
    excerpt:
      "Permission to view their own assignments",
    permissions: [
      PERMISSIONS.viewAllUsers,
      PERMISSIONS.manageAllEvents,
      PERMISSIONS.viewAllTickets,
    ],
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    label: "attendee",
    excerpt: "permission to buy tickets",
    permissions: [PERMISSIONS.viewAllEvents],
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    label: "guest",
    excerpt: "Permission to only view events",
    permissions: [PERMISSIONS.viewAllEvents],
  },
];
