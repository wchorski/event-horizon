/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

export default getViteConfig(
  {
    test: {
      exclude: ["__e2e__/**", "node_modules/**"],
    },
  },
  {
    site: "https://example.com/",
    trailingSlash: "always",
  },
);
