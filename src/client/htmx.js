import htmx from "htmx.org";
import "htmx-ext-response-targets";

if (
  import.meta.env.DEV === true &&
  import.meta.env.PUBLIC_HTMX_LOGS === "true"
) {
  // Enable logging in development mode
  htmx.logAll();
}

// Enable global view transitions
htmx.config.globalViewTransitions = true;

// Support for Astro view transitions
document.addEventListener("astro:after-swap", () => {
  htmx.process(document.body);
});
