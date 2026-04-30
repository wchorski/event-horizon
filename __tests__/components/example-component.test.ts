import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { expect, test } from "vitest";
import Card from "@components/Card.astro";
import Paragraph from "@components/Paragraph.astro";

test("Card with slots", async () => {
  const container = await AstroContainer.create();
  const slotHtml = await container.renderToString(Paragraph, {
    props: { text: "slot content is here" },
  });
  const result = await container.renderToString(Card, {
    slots: {
      default: slotHtml,
    },
    props: {
      name: "Hello Card World",
    },
  });

  expect(result).toContain("Hello Card World");
  expect(result).toContain("slot content is here");
});
