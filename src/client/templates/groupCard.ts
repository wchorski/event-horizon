// src/client/templates/groupCard.ts
import { createElement } from "@client/elementRenders";
import type { TimelineGroup, TimelineMoment } from "@ty/Schema";

export function groupCard(
  group: TimelineGroup,
  moments: TimelineMoment[],
): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "card timeline-group";
  card.dataset.groupId = String(group.id);
  card.id = String(group.id);

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "␡";
  deleteBtn.title = "delete";
  deleteBtn.classList.add("delete");
  deleteBtn.dataset.action = "delete";
  const headerEl = document.createElement("header");
  headerEl.classList.add("flex-align-center", "gap-s");
  // const heading = document.createElement("h3");
  // heading.textContent = `${group.id}`;
  const inputEl = document.createElement("input");
  inputEl.type = "text";
  inputEl.name = "name";
  inputEl.value = group.name;
  headerEl.append(inputEl, deleteBtn);
  card.appendChild(headerEl);

  if (moments.length > 0) {
    const ul = document.createElement("ul");
    moments.forEach((m) => {
      const li = document.createElement("li");
      if (m.tbd) li.dataset.tdb = String(m.tbd);
      const a = createElement("a", {
        textContent: m.desc,
        href: `#timeline-moment-anchor-${m.id}`,
      });

      li.append(a);
      ul.appendChild(li);
    });
    card.appendChild(ul);
  } else {
    const empty = document.createElement("p");
    empty.textContent = "no moments set";
    empty.classList.add("faded");
    card.appendChild(empty);
  }

  return card;
}
