// src/client/templates/timeBlockRow.ts
import { formatTimeMinutesToClockString } from "@lib/timeFormatters";
import type { BlockPlanner, GroupPlanner, TodoPlanner } from "@ty/Schema";

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
  el.classList.add("auto-size");
  el.dataset.id = String(blockId);
  el.dataset.model = "time-block";
  return el;
}

function createTodoEl(todo: TodoPlanner): HTMLLIElement {
  const li = document.createElement("li");
  li.classList.add("todo");

  const tdbCheckbox = Object.assign(document.createElement("input"), {
    type: "checkbox",
    name: "tbd",
    value: todo.tbd,
  });
  const textInput = Object.assign(document.createElement("input"), {
    name: "text",
    type: "text",
    value: todo.text,
  });
  const noteTextarea = Object.assign(document.createElement("textarea"), {
    name: "note",
    value: todo.note,
  });
  li.append(tdbCheckbox, textInput, noteTextarea);
  return li;
}

function createSubRowTodos(
  todos: TodoPlanner[],
  parentId: number,
): HTMLTableRowElement {
  const trSub = document.createElement("tr");
  trSub.className = "time-block-todos";
  trSub.dataset.parentId = String(parentId);
  // trSub.hidden = true;

  const tdSub = document.createElement("td");
  tdSub.colSpan = 999; // span all columns

  const ul = document.createElement("ul");
  ul.className = "todos";

  todos.forEach((item) => {
    ul.appendChild(createTodoEl(item));
  });

  const addBtn = document.createElement("button");
  addBtn.className = "add-todo-item";
  addBtn.dataset.id = String(parentId);
  addBtn.textContent = "+ add item";

  tdSub.append(ul, addBtn);
  trSub.appendChild(tdSub);

  return trSub;
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

  const toggleTodosBtn = document.createElement("button");
  toggleTodosBtn.className = "toggle-todos";
  toggleTodosBtn.dataset.id = id;
  toggleTodosBtn.setAttribute("aria-expanded", "false");
  toggleTodosBtn.textContent = "☰";

  return [insertAboveBtn, deleteRowBtn, insertBelowBtn, toggleTodosBtn];
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
  block: BlockPlanner,
  skills: Skill[],
  groups: GroupPlanner[],
): HTMLTableRowElement[] {
  // const fragment = document.createDocumentFragment();
  const { id, start, end, desc, skill_id, group_id, note } = block;

  const tr = document.createElement("tr");
  tr.className = "time-block-row";
  tr.dataset.blockId = String(id);

  // -- Time cell (start + end inputs)
  const tdTime = document.createElement("td");
  tdTime.dataset.fieldName = "start-end";
  tdTime.appendChild(
    createTimeInput("start", formatTimeMinutesToClockString(start), id),
  );
  tdTime.appendChild(
    createTimeInput("end", formatTimeMinutesToClockString(end), id),
  );

  // -- Desc cell
  const tdDesc = document.createElement("td");
  tdDesc.dataset.fieldName = "desc";
  tdDesc.appendChild(createTextInput("desc", desc, id));

  // -- Skill select cell
  const tdSkill = document.createElement("td");
  tdSkill.dataset.fieldName = "skill";
  tdSkill.appendChild(
    createSelectEl(
      id,
      skills.map((s) => ({ label: s.name, value: String(s.id) })),
      "skill_id",
      skill_id,
    ),
  );

  // -- Group link cell
  const tdGroup = document.createElement("td");
  tdGroup.dataset.fieldName = "group";
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

  // -- Note cell
  const tdNote = document.createElement("td");
  tdNote.dataset.fieldName = "note";
  tdNote.appendChild(createTextArea("note", note, id));

  const tdActions = document.createElement("td");
  tdActions.dataset.fieldName = "actions";
  tdActions.classList.add("actions", "grid", "gap-s");
  tdActions.append(...createActionButtons(String(id)));

  tr.append(tdTime, tdDesc, tdSkill, tdGroup, tdNote, tdActions);

  const trSub = createSubRowTodos(block.todos || [], block.id);
  // fragment.append(tr, trSub);
  return [tr, trSub];
}
