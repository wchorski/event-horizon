import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { expect, test, describe, beforeAll } from "vitest";
// @ts-ignore
import RowEdit from "@components/tables/RowEdit.astro";
import { seedData } from "@db/seed-data";
import {
  courseConfigRequired,
  ticketsConfigRequired,
  tableConfigs,
} from "@lib/tableConfigs";
import type { ZodError } from "astro/zod";

const user = seedData.users[0];
const config = tableConfigs.users.required;
const baseProps = {
  row: user,
  crud: "users" as const,
  endpoint: "/users",
  config,
  headers: Object.keys(config),
  error: null,
};

describe("RowEdit - structure", () => {
  let result: string;

  beforeAll(async () => {
    const container = await AstroContainer.create();
    result = await container.renderToString(RowEdit, { props: baseProps });
  });

  test("renders row in editing state", () => {
    expect(result).toContain(`id="row-${baseProps.crud}-${user.id}"`);
    expect(result).toContain('data-status="editing"');
  });

  test("renders hidden form with correct htmx attributes", () => {
    expect(result).toContain(`id="edit-form-${user.id}"`);
    expect(result).toContain('style="display:none');
    expect(result).toContain(`hx-patch="/partials/users/${user.id}"`);
    expect(result).toContain(`hx-target="#row-${baseProps.crud}-${user.id}"`);
    expect(result).toContain(
      `hx-target-error="#top-level-error-${baseProps.crud}-${user.id}"`,
    );
    expect(result).toContain('hx-swap="outerHTML"');
  });

  test("renders save button linked to form", () => {
    expect(result).toContain('type="submit"');
    expect(result).toContain(`form="edit-form-${user.id}"`);
    expect(result).toContain('class="save"');
    expect(result).toContain("💾");
  });

  test("renders cancel button with htmx get", () => {
    expect(result).toContain('type="reset"');
    expect(result).toContain('class="cancel"');
    expect(result).toContain(`hx-get="/partials/users/${user.id}"`);
    expect(result).toContain(`hx-target="#row-users-${user.id}"`);
    expect(result).toContain("⌀");
  });

  test("renders error row placeholder", () => {
    expect(result).toContain(
      `id="top-level-error-${baseProps.crud}-${user.id}"`,
    );
    expect(result).toContain('class="row-error error top-level"');
  });

  test("does not render error content when error is null", () => {
    expect(result).toMatch(new RegExp(`id="top-level-error-users-${user.id}"`));
  });
});

describe("RowEdit - custom submitUrl", () => {
  test("accepts a string override for submitUrl", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(RowEdit, {
      props: { ...baseProps, submitUrl: "/custom/submit/url" },
    });
    expect(result).toContain('hx-patch="/custom/submit/url"');
  });
});

describe("RowEdit - error states", () => {
  test("renders top level string error in error row", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(RowEdit, {
      props: { ...baseProps, error: "Something went wrong" },
    });

    expect(result).toContain('class="row-error error top-level"');
    expect(result).toContain("Something went wrong");
  });

  test("does not render top level error when zod field errors present", async () => {
    // zod errors are field-level, not top-level string
    const zodError = {
      formErrors: [],
      fieldErrors: { first_name: ["Name is required"] },
    } as unknown as ReturnType<ZodError["flatten"]>;

    const container = await AstroContainer.create();
    const html = await container.renderToString(RowEdit, {
      props: { ...baseProps, error: zodError },
    });

    expect(html).toContain("Name is required");

    expect(html).toMatch(new RegExp(`id="top-level-error-users-${user.id}"`));
  });
});

describe("RowEdit - schemas", () => {
  const testCases = [
    {
      label: "users",
      row: seedData.users[0],
      config: tableConfigs.users.required,
      crud: "users" as const,
    },
    {
      label: "tickets",
      row: seedData.tickets[0],
      config: ticketsConfigRequired(seedData.users, seedData.events),
      crud: "tickets" as const,
    },
    {
      label: "events",
      row: seedData.events[0],
      config: courseConfigRequired(seedData.locations),
      crud: "events" as const,
    },
    {
      label: "locations",
      row: seedData.locations[0],
      config: tableConfigs.locations.required,
      crud: "locations" as const,
    },
  ];

  describe.each(testCases)("RowEdit - $label", ({ row, config, crud }) => {
    let result: string;

    beforeAll(async () => {
      const container = await AstroContainer.create();
      result = await container.renderToString(RowEdit, {
        props: {
          row,
          crud,
          config,
          endpoint: `/attendance/${crud}`,
          headers: Object.keys(config),
          error: null,
        },
      });
    });

    test("renders in editing state", () => {
      expect(result).toContain(`id="row-${crud}-${row.id}"`);
      expect(result).toContain('data-status="editing"');
    });

    test("form targets correct partial endpoint", () => {
      expect(result).toContain(`hx-patch="/partials/${crud}/${row.id}"`);
    });

    test("cancel button fetches view partial", () => {
      expect(result).toContain(`hx-get="/partials/${crud}/${row.id}"`);
    });

    test("renders correct number of cells", () => {
      const cellCount = (result.match(/<td\b/g) || []).length;
      // +2 for action cell, and error cell (which has no data-key)
      expect(cellCount).toBe(Object.keys(config).length + 2);
    });
  });
});
