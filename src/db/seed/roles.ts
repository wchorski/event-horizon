import { PERMISSIONS } from "@lib/auth/roles";

export default [
  {
    id: "019f392b-fad6-70e2-8287-a05da261d652",
    label: "admin",
    excerpt: "Permission to create/read/update/delete all data",
    permissions: Object.values(PERMISSIONS), // admin gets everything
  },
  {
    id: "019f392b-fad6-75d5-876e-30536fab2fd4",
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
    id: "019f392b-fad6-70ab-a90f-bf3e25f8f19c",
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
    id: "019f392b-fad6-711b-a492-037f1d6e27e7",
    label: "attendee",
    excerpt: "permission to buy tickets",
    permissions: [PERMISSIONS.viewAllEvents],
  },
  {
    id: "019f392b-fad6-77f5-9b67-db18b9f9fcee",
    label: "guest",
    excerpt: "Permission to only view events",
    permissions: [PERMISSIONS.viewAllEvents],
  },
];
