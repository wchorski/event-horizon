import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { expect, test, describe } from "vitest";
import RowView from "@components/tables/RowView.astro";
import { seedData } from "@db/seed-data";
import { tableConfigs } from "@lib/tableConfigs";

const user = seedData.users[0];
const config = tableConfigs.users.required;

describe("RowView - user row", () => {
  let result: string;
  const row = user;
  const model = "users";

  test("renders user data correctly", async () => {
    const component = await AstroContainer.create();
    result = await component.renderToString(RowView, {
      props: {
        row: user,
        crud: "users" as const,
        endpoint: "/users",
        config,
        headers: Object.keys(config),
      },
    });

    // test fields individually - each renders in its own <td>
    expect(result).toContain("Admin"); // first_name
    expect(result).toContain("AAAttendance"); // last_name
    expect(result).toContain("admin@attendance.lan");
  });

  test("renders correct row id", async () => {
    expect(result).toContain(`id="row-${model}-${row.id}"`);
    expect(result).toContain(`data-row-id="${row.id}"`);
  });

  test("renders htmx attributes on edit button", async () => {
    expect(result).toContain(`hx-get="/partials/${model}/${row.id}/edit"`);
    expect(result).toContain(`hx-target="#row-${model}-${row.id}"`);
    expect(result).toContain(`hx-swap="outerHTML"`);
  });

  test("renders htmx attributes on delete button", async () => {
    expect(result).toContain(`hx-delete="/partials/users/${user.id}"`);
    expect(result).toContain(
      `hx-confirm="Delete this ${model} ${row.first_name}?"`,
    );
    expect(result).toContain(
      `hx-target-error="#top-level-error-${model}-${row.id}"`,
    );
  });

  test("renders correct data-status on row", async () => {
    expect(result).toContain('data-status="viewing"');
  });

  test("renders all cell data correctly", async () => {
    expect(result).toContain("+1 (111) 111-1111"); // phone
    expect(result).toContain("111 Admin Lane"); // address_1
    expect(result).toContain("Admin City"); // city
    expect(result).toContain("Adminland"); // state
    expect(result).toContain("10101"); // zip
  });

  test("renders empty fields as fallback dash", async () => {
    // middle_initial and address_2 are empty in seed data - should show '-'
    const dashCount = (result.match(/class="sub-text"/g) || []).length;
    expect(dashCount).toBeGreaterThanOrEqual(2);
  });

  test("renders id cell as a link", async () => {
    expect(result).toContain(`<a href="/users/${row.id}"`);
    expect(result).toContain(`>${row.id}<`);
  });

  test("renders correct number of cells", async () => {
    const cellCount = (result.match(/class="view-cell"/g) || []).length;
    expect(cellCount).toBe(Object.keys(config).length);
  });

  test("renders action cell with edit and delete buttons", async () => {
    expect(result).toContain('class="edit"');
    expect(result).toContain('class="btn delete primary danger"');
  });
});
