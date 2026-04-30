import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { expect, test, describe, beforeAll } from "vitest";
import RowView from "@components/tables/RowView.astro";
import { seedData } from "@db/seed-data";
import {
  courseConfigRequired,
  ticketsConfigRequired,
  tableConfigs,
} from "@lib/tableConfigs";
import { prettyPlainCivilDateFull } from "@lib/formatters";

// define each schema's test case
const testCases = [
  {
    label: "users",
    row: seedData.users[0],
    config: tableConfigs.users.required,
    crud: "users" as const,
    endpoint: "/users",
    expectedFields: [
      seedData.users[0].first_name,
      seedData.users[0].last_name,
      seedData.users[0].email,
    ],
  },
  {
    label: "tickets",
    row: seedData.tickets[0],
    config: ticketsConfigRequired(seedData.users, seedData.events),
    crud: "tickets" as const,
    endpoint: "/tickets",
    expectedFields: [
      seedData.events[0].id,
      `${seedData.events[0].subject} | ${prettyPlainCivilDateFull(seedData.events[0].date_civil)}`,
      // TODO how to check for correct timestamp
      // seedData.events[0].timestamp,
      seedData.tickets[0].attended,
    ],
  },
  {
    label: "events",
    row: seedData.events[0],
    config: courseConfigRequired(seedData.locations),
    crud: "events" as const,
    endpoint: "/admin/events/id",
    expectedFields: [
      seedData.events[0].id,
      seedData.events[0].subject,
      seedData.events[0].excerpt,
      prettyPlainCivilDateFull(seedData.events[0].date_civil),
      // TODO location[0].name ??
    ],
  },
  {
    label: "locations",
    row: seedData.locations[0],
    config: tableConfigs.locations.required,
    crud: "locations" as const,
    endpoint: "/admin/locations/id",
    expectedFields: [
      seedData.locations[0].id,
      seedData.locations[0].name,
      seedData.locations[0].address,
      seedData.locations[0].city,
      seedData.locations[0].state,
      seedData.locations[0].zip,
      seedData.locations[0].timezone,
    ],
  },
];

describe.each(testCases)(
  "RowView - $label",
  ({ row, config, crud, endpoint, expectedFields }) => {
    let result: string;

    beforeAll(async () => {
      const component = await AstroContainer.create();
      result = await component.renderToString(RowView, {
        props: {
          row,
          crud,
          endpoint,
          config,
          headers: Object.keys(config),
        },
      });
    });

    test("renders expected field values", () => {
      expectedFields.forEach((field) => {
        expect(result).toContain(field);
      });
    });

    test("renders correct number of cells", () => {
      const cellCount = (result.match(/class="view-cell"/g) || []).length;
      expect(cellCount).toBe(Object.keys(config).length);
    });

    test("renders correct row id", () => {
      expect(result).toContain(`id="row-${crud}-${row.id}"`);
      expect(result).toContain(`data-row-id="${row.id}"`);
    });

    test("starts in viewing state", () => {
      expect(result).toContain('data-status="viewing"');
    });

    test("renders htmx edit attributes", () => {
      expect(result).toContain(`hx-get="/partials/${crud}/${row.id}/edit"`);
      expect(result).toContain(`hx-target="#row-${crud}-${row.id}"`);
      expect(result).toContain('hx-swap="outerHTML"');
    });

    test("renders htmx delete attributes", () => {
      expect(result).toContain(`hx-delete="/partials/${crud}/${row.id}"`);
      expect(result).toContain(`hx-target="#row-${crud}-${row.id}"`);
    });

    test("renders edit and delete buttons", () => {
      expect(result).toContain('class="edit"');
      expect(result).toContain('class="btn delete primary danger"');
    });
  },
);

// The output in your terminal will be nicely grouped and labeled:

// RowView - users
//   ✓ renders expected field values
//   ✓ renders correct number of cells
//   ✓ renders correct row id
//   ...

// RowView - tickets
//   ✓ renders expected field values
//   ✓ renders correct number of cells
//   ...
