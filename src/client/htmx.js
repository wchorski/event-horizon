// client/htmx.js
import htmx from "htmx.org";
import "htmx-ext-response-targets";
import { PUBLIC_HTMX_LOGS } from "astro:env/client";
const isDev = import.meta.env.DEV;

// console.log("will astro:env/client work in this client/htmx.js script?");
// console.log({ PUBLIC_HTMX_LOGS });

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

// Network failure / offline handling
function showNetworkError(target) {
  // Find a per-form slot if one exists, else fall back to a global one
  const form = target?.closest?.("form");
  const slot =
    form?.querySelector("[data-network-error]") ??
    document.getElementById("network-error");
  if (slot) slot.hidden = false;
}

function clearNetworkError() {
  document
    .querySelectorAll("[data-network-error], #network-error")
    .forEach((el) => (el.hidden = true));
}

// Fail fast when the browser knows it's offline
document.addEventListener("htmx:confirm", (e) => {
  if (!navigator.onLine) {
    e.preventDefault();
    showNetworkError(e.detail.elt);
  }
});

// Request was sent but never reached a server (wifi with no internet, DNS, etc.)
document.addEventListener("htmx:sendError", (e) => showNetworkError(e.detail.elt));
document.addEventListener("htmx:timeout", (e) => showNetworkError(e.detail.elt));

// Reset on the next attempt
document.addEventListener("htmx:beforeRequest", clearNetworkError);

htmx.config.timeout = 10000;