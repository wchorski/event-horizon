import { createElement } from "@client/elementRenders";
import type { TimelineSkill } from "@ty/Schema";

export function skillListItem(skill: TimelineSkill) {
  const { id, name, icon, color } = skill;
  const nameInputEl = createElement(
    "input",
    {
      type: "text",
      name: "name",
      value: name,
    },
    { skillId: String(id) },
  );
  const iconInputEl = createElement("input", {
    type: "text",
    name: "icon",
    value: icon,
    maxLength: 1,
  });
  const colorInputEl = createElement("input", {
    type: "color",
    name: "color",
    value: color,
  });

  const deleteBtn = createElement(
    "button",
    {
      textContent: "␡",
      title: "delete",
      className: "delete",
    },
    { action: "delete" },
  );

  const liEl = createElement("li", {
    className: "editable",
  });

  liEl.append(nameInputEl, iconInputEl, colorInputEl, deleteBtn);
  return liEl;
}
