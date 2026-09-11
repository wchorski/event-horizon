// db/seed/departments.ts
import type { DepartmentInsert } from "@ty/Schema";

export type DepartmentSeedInsert = Omit<
  DepartmentInsert,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};

const departments: DepartmentSeedInsert[] = [
  {
    id: "01a091b4-b532-7b9b-9fee-95b4ad19ca0b",
    organization_id: "01a09194-09ff-7d63-9c55-d0096b02db89",
    name: "MOEITS",
    slug: "moeits",
    color: "black",
    createdAt: "2026-05-01T21:06:36.444Z",
    updatedAt: "2026-05-01T21:06:36.444Z",
  },
  {
    id: "01a091b4-eddc-79c1-881d-e9ea3f269f67",
    organization_id: "01a09194-09ff-7d63-9c55-d0096b02db89",
    name: "Finance",
    slug: "finance",
    color: "red",
    createdAt: "2026-05-01T21:06:36.444Z",
    updatedAt: "2026-05-01T21:06:36.444Z",
  },
  {
    id: "01a091b4-f08f-76b7-88fc-2bbf4304da78",
    organization_id: "01a09194-09ff-7d63-9c55-d0096b02db89",
    name: "Health & Wealfare",
    slug: "health-and-wealfare",
    color: "blue",
    createdAt: "2026-05-01T21:06:36.444Z",
    updatedAt: "2026-05-01T21:06:36.444Z",
  },
];
export default departments;
