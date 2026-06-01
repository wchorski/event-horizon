// src/client/templates/groupCard.ts
interface Block { desc: string; group_id: number; }
interface Group { id: number; name: string; }

export function groupCard(group: Group, blocks: Block[]): HTMLDivElement {
  const related = blocks.filter(b => b.group_id === group.id);

  const card = document.createElement("div");
  card.className = "card";
  card.id = String(group.id);

  const heading = document.createElement("h3");
  heading.textContent = `${group.name} | ${group.id}`;
  card.appendChild(heading);

  if (related.length > 0) {
    const ul = document.createElement("ul");
    related.forEach(b => {
      const li = document.createElement("li");
      li.textContent = b.desc;
      ul.appendChild(li);
    });
    card.appendChild(ul);
  } else {
    const empty = document.createElement("p");
    empty.textContent = "no plans set";
    card.appendChild(empty);
  }

  return card;
}