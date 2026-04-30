import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { expect, test, describe, beforeAll } from "vitest";
// @ts-ignore
import RowCreate from "@components/tables/RowCreate.astro";
import { seedData } from "../../src/db/seed-data";
import {
  courseConfigRequired,
  ticketsConfigRequired,
  tableConfigs,
} from "@lib/tableConfigs";

describe("RowCreate - structure", () => {
  const config = tableConfigs.users.required;

  const baseProps = {
    crud: "users" as const,
    config,
    headers: Object.keys(config),
  };

  let result: string;

  beforeAll(async () => {
    const container = await AstroContainer.create();
    result = await container.renderToString(RowCreate, {
      props: baseProps,
    });
  });

  test("renders row in creating state", () => {
    expect(result).toContain(`id="row-create-${baseProps.crud}"`);
    expect(result).toContain('data-status="creating"');
  });

  test("renders hidden create form with correct htmx attributes", () => {
    expect(result).toContain(`id="create-form-${baseProps.crud}"`);
    expect(result).toContain('style="display:none');
    expect(result).toContain(`hx-post="/partials/users/create"`);
    expect(result).toContain(
      `hx-target-error="#top-level-error-${baseProps.crud}-create"`,
    );
    expect(result).toContain('hx-swap="beforeend"');
  });

  test("renders save button linked to form", () => {
    expect(result).toContain('type="submit"');
    expect(result).toContain(`form="create-form-${baseProps.crud}"`);
    expect(result).toContain('class="save"');
  });

  test("renders clear button with data-clear-form", () => {
    expect(result).toContain('type="button"');
    expect(result).toContain('class="cancel"');
    expect(result).toContain(`data-clear-form="create-form-${baseProps.crud}"`);
  });

  test("renders error row placeholder", () => {
    expect(result).toContain(`id="top-level-error-${baseProps.crud}-create"`);
    expect(result).toContain('class="error-cell"');
  });
});

describe("RowCreate - custom actionUrl", () => {
  test("accepts a string override for actionUrl", async () => {
    const config = tableConfigs.users.required;

    const container = await AstroContainer.create();
    const result = await container.renderToString(RowCreate, {
      props: {
        crud: "users",
        config,
        headers: Object.keys(config),
        actionUrl: "/custom/create/url",
      },
    });

    expect(result).toContain('hx-post="/custom/create/url"');
  });
});

describe("RowCreate - schemas", () => {
  const testCases = [
    {
      label: "users",
      config: tableConfigs.users.required,
      crud: "users" as const,
    },
    {
      label: "tickets",
      config: ticketsConfigRequired(seedData.users, seedData.events),
      crud: "tickets" as const,
    },
    {
      label: "events",
      config: courseConfigRequired(seedData.locations),
      crud: "events" as const,
    },
    {
      label: "locations",
      config: tableConfigs.locations.required,
      crud: "locations" as const,
    },
  ];

  describe.each(testCases)("RowCreate - $label", ({ config, crud }) => {
    let result: string;

    beforeAll(async () => {
      const container = await AstroContainer.create();
      result = await container.renderToString(RowCreate, {
        props: {
          crud,
          config,
          headers: Object.keys(config),
        },
      });
    });

    test("renders in creating state", () => {
      expect(result).toContain(`id="row-create-${crud}"`);
      expect(result).toContain('data-status="creating"');
    });

    test("form targets correct create endpoint", () => {
      expect(result).toContain(`hx-post="/partials/${crud}/create"`);
    });

    test("renders correct number of cells", () => {
      const cellCount = (result.match(/<td\b/g) || []).length;

      // +2 for action cell and error cell
      expect(cellCount).toBe(Object.keys(config).length + 2);
    });

    test("renders id field as empty success cell", () => {
      if ("id" in config) {
        expect(result).toContain('class="background-success"');
      }
    });
  });
});
