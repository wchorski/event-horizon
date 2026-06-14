// src/client/templates/groupCard.ts
interface Block {
  desc: string;
  group_id: number;
}
interface Group {
  id: number;
  name: string;
}

export function groupCard(group: Group, blocks: Block[]): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "card timeline-group";
  card.dataset.groupId = String(group.id);
  card.id = String(group.id);

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "␡";
  deleteBtn.title = "delete";
  deleteBtn.classList.add("delete");
  deleteBtn.dataset.action = "delete"
  const headerEl = document.createElement("header");
  headerEl.classList.add("flex-align-center", "gap-s");
  const heading = document.createElement("h3");
  heading.textContent = `${group.id}`;
  const inputEl = document.createElement("input");
  inputEl.type = "text";
  inputEl.name = "name";
  inputEl.value = group.name;
  headerEl.append(heading, inputEl, deleteBtn);
  card.appendChild(headerEl);

  if (blocks.length > 0) {
    const ul = document.createElement("ul");
    blocks.forEach((b) => {
      const li = document.createElement("li");
      li.textContent = b.desc;
      ul.appendChild(li);
    });
    card.appendChild(ul);
  } else {
    const empty = document.createElement("p");
    empty.textContent = "no plans set";
    empty.classList.add("faded");
    card.appendChild(empty);
  }

  return card;
}
