import type { OrganizationInsert } from "@ty/Schema";

export type OrganizationSeedInsert = Omit<
  OrganizationInsert,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};

const organizations: OrganizationSeedInsert[] = [
  {
    id: "019f5cbf-a96a-7b3c-8ef6-4cf135103f75",
    name: "There's a Will, There's a Website",
    slug: "tawtaw",
    color: "#5fd3b2",
    color_2: "#4ca1f0",
    logo: "https://www.tawtaw.site/assets/logo.svg",
    dedicated_db_url: null,
    createdAt: "2026-05-01T21:06:36.444Z",
    updatedAt: "2026-05-01T21:06:36.444Z",
    sharepoint_site_url: null,
    sharepoint_site_id: null,
    sharepoint_drive_id: null,
    sharepoint_library_name: null,
    metadata: null,
  },
  {
    id: "019f5cbf-87b7-7d63-ac40-197b22468aa6",
    name: "Party Vibe Online",
    slug: "pvo",
    dedicated_db_url: null,
    color: "#510691",
    color_2: "#8a5cc0",
    logo: "https://pvo.tawtaw.site/_next/image?url=%2Fassets%2Flogo.png&w=1200&q=75",
    createdAt: "2026-05-01T21:06:36.444Z",
    updatedAt: "2026-05-01T21:06:36.444Z",
    sharepoint_site_url: null,
    sharepoint_site_id: null,
    sharepoint_drive_id: null,
    sharepoint_library_name: null,
    metadata: null,
  },
  {
    id: "01a09194-09ff-7d63-9c55-d0096b02db89",
    name: "Midwest Operating Engineers",
    slug: "moe",
    dedicated_db_url: null,
    color: "#738793",
    color_2: "#0873b1",
    logo: "https://local150.org/wp-content/uploads/2020/06/moe-logo.png",
    createdAt: "2026-05-01T21:06:36.444Z",
    updatedAt: "2026-05-01T21:06:36.444Z",
    sharepoint_site_url: "https://moeits.sharepoint.com/sites/MOEDocs",
    sharepoint_site_id: "moeits.sharepoint.com,fd7cc296-d084-4604-941a-bdc70e6195e4,a20a733c-1f92-4c6f-8415-7469223ee708",
    sharepoint_drive_id: "b!lsJ8_YTQBEaUGr3HDmGV5DxzCqKSH29MhBV0aSI-5wjanyzd4OQnQKS3XpK0w3l4",
    sharepoint_library_name: null,
    metadata: null,
  },
];
export default organizations;
