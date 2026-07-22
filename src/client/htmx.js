import htmx from "htmx.org";
import "htmx-ext-response-targets";
import { PUBLIC_HTMX_LOGS } from "astro:env/client";
const isDev = import.meta.env.DEV;

console.log("will astro:env/client work in this client/htmx.js script?");
console.log({ PUBLIC_HTMX_LOGS });

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
