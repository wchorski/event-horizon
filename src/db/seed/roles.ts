import { PERMISSIONS } from "@lib/auth/roles";

export default [
  {
    id: "019f392b-fad6-70e2-8287-a05da261d652",
    label: "admin",
    excerpt: "Permission to create/read/update/delete all data",
    organization_id: "019f5cbf-a96a-7b3c-8ef6-4cf135103f75",
    permissions: Object.values(PERMISSIONS), // admin gets everything
  },
  {
    id: "019f392b-fad6-75d5-876e-30536fab2fd4",
    label: "host",
    excerpt:
      "Permission to create/read/update/delete all users, events, locations, & tickets",
      organization_id: "019f5cbf-a96a-7b3c-8ef6-4cf135103f75",
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
      organization_id: "019f5cbf-a96a-7b3c-8ef6-4cf135103f75",
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
    organization_id: "019f5cbf-a96a-7b3c-8ef6-4cf135103f75",
    permissions: [PERMISSIONS.viewAllEvents],
  },
  {
    id: "019f392b-fad6-77f5-9b67-db18b9f9fcee",
    label: "guest",
    excerpt: "Permission to only view events",
    organization_id: "019f5cbf-a96a-7b3c-8ef6-4cf135103f75",
    permissions: [PERMISSIONS.viewAllEvents],
  },
];
