// src/client/templates/timeBlockRow.ts
import { createElement } from "@client/elementRenders";
import { BLOCKS_STORE, TODOS_STORE } from "@client/indexedDB";
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
  padSize?: "xs" | "s" | "m" | "l",
): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "text";
  input.name = name;
  input.value = value;
  input.id = `timeline-block-${blockId}-${name}`;
  input.dataset.id = String(blockId);
  input.dataset.model = "time-block";
  if (padSize) input.classList.add(`pad-${padSize}`);

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

export function createTodoEl(todo: TodoPlanner): HTMLLIElement {
  const li = document.createElement("li");
  li.dataset.todoId = String(todo.id);
  li.classList.add("todo", "anim--slide-in-left-right");

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
  const deleteBtn = createElement(
    "button",
    { className: "delete", textContent: "delete" },
    { action: "delete", type: TODOS_STORE },
  );
  // const deleteBtn = Object.assign(document.createElement("button"), {
  //   className: "delete",
  //   textContent: "delete",
  //   dataset: { action: "delete", type: "todo" },
  // });
  li.append(tdbCheckbox, textInput, noteTextarea, deleteBtn);
  return li;
}

function createSubRowTodos(
  todos: TodoPlanner[],
  parentId: number,
): HTMLTableRowElement {
  const trSub = document.createElement("tr");
  trSub.className = "time-block-todos";
  trSub.classList.add("time-block-todos", "anim--slide-in-left-right");
  trSub.dataset.blockId = String(parentId);
  // trSub.hidden = true;

  const tdSub = document.createElement("td");
  tdSub.colSpan = 999; // span all columns

  const ul = document.createElement("ul");
  ul.className = "todos";

  todos.forEach((item) => {
    ul.appendChild(createTodoEl(item));
  });

  // const addBtn = document.createElement("button");
  const addBtn = createElement(
    "button",
    { className: "add-todo-item ghost", textContent: "+ add item" },
    { blockId: String(parentId), action: "create", type: TODOS_STORE },
  );
  // addBtn.className = "add-todo-item";
  // addBtn.classList.add("ghost");
  // addBtn.dataset.blockId = String(parentId);
  // addBtn.textContent = "+ add item";
  // addBtn.dataset.action = "create";
  // addBtn.dataset.type = TODOS_STORE;

  tdSub.append(ul, addBtn);
  trSub.appendChild(tdSub);

  return trSub;
}

function createActionButtons(id: string): HTMLButtonElement[] {
  const insertAboveBtn = document.createElement("button");
  const insertBelowBtn = document.createElement("button");
  const deleteRowBtn = document.createElement("button");

  deleteRowBtn.dataset.blockId = id;
  deleteRowBtn.textContent = "delete";
  deleteRowBtn.dataset.action = "delete";
  deleteRowBtn.dataset.type = BLOCKS_STORE;
  deleteRowBtn.classList.add("delete");
  deleteRowBtn.title = "delete this row";

  insertAboveBtn.textContent = "+↑";
  insertAboveBtn.dataset.action = "insert";
  insertAboveBtn.dataset.direction = "above";
  insertAboveBtn.dataset.type = BLOCKS_STORE;
  insertAboveBtn.classList.add("insert", "above");
  insertAboveBtn.title = "insert row above";

  insertBelowBtn.textContent = "+↓";
  insertBelowBtn.classList.add("insert", "below");
  insertBelowBtn.dataset.action = "insert";
  insertBelowBtn.dataset.direction = "below";
  insertBelowBtn.dataset.type = BLOCKS_STORE;
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
  padSize?: "xs" | "s" | "m" | "l",
): HTMLSelectElement {
  const select = document.createElement("select");
  select.name = fieldName;
  select.dataset.id = String(blockId);
  if (padSize) select.classList.add(`pad-${padSize}`);

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
  partial?: Partial<BlockPlanner>,
): Omit<BlockPlanner, "id"> {
  return {
    start: 0,
    end: 0,
    desc: "",
    skill_id: 0,
    group_id: 0,
    note: "",
    tbd: false,
    ...partial,
  };
}

export function timeBlockRow(
  block: BlockPlanner,
  skills: Skill[],
  groups: GroupPlanner[],
  todos: TodoPlanner[] | undefined,
): HTMLTableRowElement[] {
  // const fragment = document.createDocumentFragment();
  const { id, start, end, desc, skill_id, group_id, note } = block;

  const tr = document.createElement("tr");
  tr.id = `timeline-block-anchor-${id}`
  tr.dataset.blockId = String(id);
  tr.classList.add("time-block-row", "anim--slide-in-left-right");

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
  tdDesc.appendChild(createTextInput("desc", desc, id, "xs"));

  // -- Skill select cell
  const tdSkill = document.createElement("td");
  tdSkill.dataset.fieldName = "skill";
  tdSkill.appendChild(
    createSelectEl(
      id,
      skills.map((s) => ({ label: s.name, value: String(s.id) })),
      "skill_id",
      skill_id,
      "xs",
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
    "xs"
  );
  groupLink.href = `#${group_id}`;
  groupLink.textContent = String(group_id);
  tdGroup.appendChild(groupSelectEl);
  // tdGroup.appendChild(groupLink);

  // -- Note cell
  const tdNote = document.createElement("td");
  tdNote.dataset.fieldName = "note";
  tdNote.appendChild(createTextArea("note", note, id));

  const tdActions = document.createElement("td");
  tdActions.dataset.fieldName = "actions";
  tdActions.classList.add("actions", "grid", "gap-s");
  tdActions.append(...createActionButtons(String(id)));

  tr.append(tdTime, tdDesc, tdSkill, tdGroup, tdNote, tdActions);

  const trSub = createSubRowTodos(todos || [], block.id);
  // fragment.append(tr, trSub);
  return [tr, trSub];
}
