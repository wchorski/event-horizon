// src/client/templates/timeBlockRow.ts
import { formatTimeMinutesToClockString } from "@lib/timeFormatters";
import type { BlockPlanner, GroupPlanner } from "@ty/Schema";

interface Skill {
  id: number;
  name: string;
}
interface Block {
  id: number;
  start: number;
  end: number;
  desc: string;
  skill_id: number;
  group_id: number;
  note: string;
}

function createTimeInput(
  name: string,
  value: string,
  blockId: number,
): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "time";
  input.name = name;
  input.value = value;
  input.id = `timeline-block-${blockId}-${name}`;
  input.dataset.id = String(blockId);
  input.dataset.model = "time-block";
  return input;
}

function createTextInput(
  name: string,
  value: string,
  blockId: number,
): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "text";
  input.name = name;
  input.value = value;
  input.id = `timeline-block-${blockId}-${name}`;
  input.dataset.id = String(blockId);
  input.dataset.model = "time-block";
  return input;
}
function createTextArea(
  name: string,
  value: string,
  blockId: number,
): HTMLTextAreaElement {
  const el = document.createElement("textarea");
  el.name = name;
  el.value = value;
  el.id = `timeline-block-${blockId}-${name}`;
  el.dataset.id = String(blockId);
  el.dataset.model = "time-block";
  return el;
}

function createActionButtons(id: string): HTMLButtonElement[] {
  const insertAboveBtn = document.createElement("button");
  const insertBelowBtn = document.createElement("button");
  const deleteRowBtn = document.createElement("button");

  deleteRowBtn.dataset.blockId = id;
  insertAboveBtn.textContent = "+↑";
  insertBelowBtn.textContent = "+↓";
  deleteRowBtn.textContent = "delete";
  insertAboveBtn.classList.add("insert", "above");
  insertBelowBtn.classList.add("insert", "below");
  deleteRowBtn.classList.add("delete");
  deleteRowBtn.title = "delete this row";
  insertAboveBtn.title = "insert row above";
  insertBelowBtn.title = "insert row below";

  return [insertAboveBtn, deleteRowBtn, insertBelowBtn];
}

function createSelectEl(
  blockId: number,
  options: { label: string; value: string }[],
  fieldName: string,
  selectedId?: number,
): HTMLSelectElement {
  const select = document.createElement("select");
  select.name = fieldName;
  select.dataset.id = String(blockId);

  options.forEach((skill) => {
    const option = document.createElement("option");
    option.value = skill.value;
    option.textContent = skill.label;
    option.selected = skill.value === String(selectedId);
    select.appendChild(option);
  });

  return select;
}

export function createEmptyBlock(
  id: number,
  block?: Partial<BlockPlanner>,
): Block {
  return {
    id,
    start: 0,
    end: 0,
    desc: "",
    skill_id: 0,
    group_id: 0,
    note: "",
    ...block,
  };
}

export function timeBlockRow(
  block: Block,
  skills: Skill[],
  groups: GroupPlanner[],
): HTMLTableRowElement {
  const { id, start, end, desc, skill_id, group_id, note } = block;

  const tr = document.createElement("tr");
  tr.className = "time-block-row";
  tr.dataset.blockId = String(id);

  // -- Time cell (start + end inputs)
  const tdTime = document.createElement("td");
  tdTime.appendChild(
    createTimeInput("start", formatTimeMinutesToClockString(start), id),
  );
  tdTime.appendChild(
    createTimeInput("end", formatTimeMinutesToClockString(end), id),
  );
  tr.appendChild(tdTime);

  // -- Desc cell
  const tdDesc = document.createElement("td");
  tdDesc.appendChild(createTextInput("desc", desc, id));
  tr.appendChild(tdDesc);

  // -- Skill select cell
  const tdSkill = document.createElement("td");
  tdSkill.appendChild(
    createSelectEl(
      id,
      skills.map((s) => ({ label: s.name, value: String(s.id) })),
      "skill_id",
      skill_id,
    ),
  );
  tr.appendChild(tdSkill);

  // -- Group link cell
  const tdGroup = document.createElement("td");
  const groupLink = document.createElement("a");
  const groupSelectEl = createSelectEl(
    id,
    groups.map((g) => ({ label: g.name, value: String(g.id) })),
    "group_id",
    group_id,
  );
  groupLink.href = `#${group_id}`;
  groupLink.textContent = String(group_id);
  tdGroup.appendChild(groupSelectEl);
  tdGroup.appendChild(groupLink);
  tr.appendChild(tdGroup);

  // -- Note cell
  const tdNote = document.createElement("td");
  tdNote.appendChild(createTextArea("note", note, id));
  tr.appendChild(tdNote);

  const tdActions = document.createElement("td");
  tdActions.classList.add("actions", "grid", "gap-s");
  tdActions.append(...createActionButtons(String(id)));
  tr.appendChild(tdActions);

  return tr;
}
