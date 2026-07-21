import htmx from "htmx.org";
import "htmx-ext-response-targets";
import { PUBLIC_HTMX_LOGS } from "astro:env/client";
const isDev = import.meta.env.DEV;

if (isDev && PUBLIC_HTMX_LOGS) {
  // Enable logging in development mode
  htmx.logAll();
}

// Enable global view transitions
htmx.config.globalViewTransitions = true;

// Support for Astro view transitions
document.addEventListener("astro:after-swap", () => {
  htmx.process(document.body);
});
