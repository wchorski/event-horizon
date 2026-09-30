import { parse } from "node-html-parser"; // npm i node-html-parser
import type { Event } from "@microsoft/microsoft-graph-types";
import { msGraphFetch } from "@lib/microsoft/msGraphFetch";

export const PACKET_LINK_ID = "packet-link";

export const PLACEHOLDER_BODY = {
  contentType: "html",
  content: `<p><a id="${PACKET_LINK_ID}" href="#" style="color: red;">PACKET NOT CREATED YET</a></p>`,
} as const;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Pure function: swap (or insert) the packet link in an HTML string. */
export function setPacketLinkInHtml(html: string, href: string, label: string): string {
  const root = parse(html);
  const link = root.querySelector(`#${PACKET_LINK_ID}`);

  if (link) {
    link.setAttribute("href", href);
    link.setAttribute("style", "color: #0f6cbd;");
    link.set_content(esc(label));
    return root.toString();
  }

  // Anchor is gone (Outlook/user edited it away) -> put a fresh one at the top
  const fresh = `<p><a id="${PACKET_LINK_ID}" href="${esc(href)}">${esc(label)}</a></p>`;
  const body = root.querySelector("body") ?? root;
  body.insertAdjacentHTML("afterbegin", fresh);
  return root.toString();
}

/** GET the event body, update the link, PATCH it back. */
export async function updateEventPacketLink(opts: {
  organizationId: string;
  mailboxUserEmail: string;
  outlookEventId: string;
  href: string;
  label: string;
}) {
  const { organizationId, mailboxUserEmail, outlookEventId, href, label } = opts;
  const eventUrl = `/users/${mailboxUserEmail}/events/${outlookEventId}`;

  const current = await msGraphFetch<Pick<Event, "id" | "body">>(
    organizationId,
    `${eventUrl}?$select=id,body`,
    {
      method: "GET",
      // make sure we get HTML back, not text
      headers: { Prefer: 'outlook.body-content-type="html"' },
    },
  );

  const html = current.body?.content ?? "";
  const nextHtml = setPacketLinkInHtml(html, href, label);

  return msGraphFetch<Pick<Event, "id" | "webLink">>(organizationId, eventUrl, {
    method: "PATCH",
    body: JSON.stringify({ body: { contentType: "html", content: nextHtml } }),
  });
}