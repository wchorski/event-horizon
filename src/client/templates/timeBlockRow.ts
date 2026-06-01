// src/client/templates/timeBlockRow.ts
import { formatTimeMinutesToClockString } from "@lib/timeFormatters";

interface Skill { id: number; name: string; }
interface Block {
  id: number; start: number; end: number;
  desc: string; skill_id: number; group_id: number; note: string;
}

function createTimeInput(name: string, value: string, blockId: number): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "time";
  input.name = name;
  input.value = value;
  input.id = `timeline-block-${blockId}-${name}`;
  input.dataset.id = String(blockId);
  input.dataset.model = "time-block";
  return input;
}

function createTextInput(name: string, value: string, blockId: number): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "text";
  input.name = name;
  input.value = value;
  input.id = `timeline-block-${blockId}-${name}`;
  input.dataset.id = String(blockId);
  input.dataset.model = "time-block";
  return input;
}

function createSkillSelect(blockId: number, skillId: number, skills: Skill[]): HTMLSelectElement {
  const select = document.createElement("select");
  select.name = "skill_id";
  select.dataset.id = String(blockId);

  skills.forEach(skill => {
    const option = document.createElement("option");
    option.value = String(skill.id);
    option.textContent = skill.name;
    option.selected = skill.id === skillId;
    select.appendChild(option);
  });

  return select;
}

export function createEmptyBlock(id: number): Block {
  return {
    id,
    start: 0,
    end: 0,
    desc: "",
    skill_id: 0,
    group_id: 0,
    note: "",
  };
}

export function timeBlockRow(block: Block, skills: Skill[]): HTMLTableRowElement {
  const { id, start, end, desc, skill_id, group_id, note } = block;

  const tr = document.createElement("tr");
  tr.className = "time-block-row";

  // -- Time cell (start + end inputs)
  const tdTime = document.createElement("td");
  tdTime.appendChild(createTimeInput("start", formatTimeMinutesToClockString(start), id));
  tdTime.appendChild(createTimeInput("end",   formatTimeMinutesToClockString(end),   id));
  tr.appendChild(tdTime);

  // -- Desc cell
  const tdDesc = document.createElement("td");
  tdDesc.appendChild(createTextInput("desc", desc, id));
  tr.appendChild(tdDesc);

  // -- Skill select cell
  const tdSkill = document.createElement("td");
  tdSkill.appendChild(createSkillSelect(id, skill_id, skills));
  tr.appendChild(tdSkill);

  // -- Group link cell
  const tdGroup = document.createElement("td");
  const groupLink = document.createElement("a");
  groupLink.href = `#${group_id}`;
  groupLink.textContent = String(group_id);
  tdGroup.appendChild(groupLink);
  tr.appendChild(tdGroup);

  // -- Note cell
  const tdNote = document.createElement("td");
  tdNote.appendChild(createTextInput("note", note, id));
  tr.appendChild(tdNote);

  return tr;
}