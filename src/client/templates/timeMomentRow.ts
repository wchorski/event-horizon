// src/client/templates/timeMomentRow.ts
import { createElement } from "@client/elementRenders";
import { MOMENTS_STORE, STEPS_STORE } from "@client/indexedDB";
import { formatTimeMinutesToClockString } from "@lib/timeFormatters";
import type {
  TimelineMoment,
  TimelineGroup,
  MomentStep,
  TimelineSkill,
} from "@ty/Schema";
import { checkboxCornerEl } from "./checkboxCorner";

function createTimeInput(
  name: string,
  value: string,
  momentId: number,
): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "time";
  input.name = name;
  input.value = value;
  input.id = `timeline-moment-${momentId}-${name}`;
  input.dataset.id = String(momentId);
  input.dataset.model = "time-moment";
  return input;
}

function createTextInput(
  name: string,
  value: string,
  momentId: number,
  padSize?: "xs" | "s" | "m" | "l",
): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "text";
  input.name = name;
  input.value = value;
  input.id = `timeline-moment-${momentId}-${name}`;
  input.dataset.id = String(momentId);
  input.dataset.model = "time-moment";
  if (padSize) input.classList.add(`pad-${padSize}`);

  return input;
}
function createTextArea(
  name: string,
  value: string,
  momentId: number,
): HTMLTextAreaElement {
  const el = document.createElement("textarea");
  el.name = name;
  el.value = value;
  el.id = `timeline-moment-${momentId}-${name}`;
  el.classList.add("auto-size");
  el.dataset.id = String(momentId);
  el.dataset.model = "time-moment";
  return el;
}

export function createStepEl(step: MomentStep): HTMLLIElement {
  const li = document.createElement("li");
  li.dataset.stepId = String(step.id);
  li.classList.add("step", "anim--slide-in-left-right");

  // TODO replace witht
  const tdbCheckbox = checkboxCornerEl('tbd', step.tbd, 'To be determined');
  const textInput = Object.assign(document.createElement("input"), {
    name: "text",
    type: "text",
    value: step.text,
  });
  const noteTextarea = Object.assign(document.createElement("textarea"), {
    name: "note",
    value: step.note,
  });
  const deleteBtn = createElement(
    "button",
    { className: "delete", textContent: "␡", title: "delete" },
    { action: "delete", type: STEPS_STORE },
  );

  li.append(tdbCheckbox, textInput, noteTextarea, deleteBtn);
  return li;
}

function createSubRowSteps(
  steps: MomentStep[],
  parentId: number,
): HTMLTableRowElement {
  const trSub = document.createElement("tr");
  trSub.classList.add("time-moment-steps", "anim--slide-in-left-right");
  trSub.dataset.momentId = String(parentId);
  // trSub.hidden = true;

  const tdSub = document.createElement("td");
  tdSub.colSpan = 999; // span all columns

  const details = document.createElement("details");
  // details.open = true;
  const summary = createElement("summary", {
    className: "ghost",
    textContent: `${steps.length} step${steps.length > 1 ? "s" : ""}`,
  });

  const ul = document.createElement("ul");
  ul.className = "steps";

  steps.forEach((item) => {
    ul.appendChild(createStepEl(item));
  });

  // const addBtn = document.createElement("button");
  const addBtn = createElement(
    "button",
    { className: "ghost", textContent: "+ add item" },
    { momentId: String(parentId), action: "create", type: STEPS_STORE },
  );

  details.append(summary, ul, addBtn);
  tdSub.append(details);
  trSub.appendChild(tdSub);

  return trSub;
}

function createActionButtons(id: string): HTMLElement[] {
  const insertAboveBtn = document.createElement("button");
  const insertBelowBtn = document.createElement("button");
  const deleteRowBtn = document.createElement("button");
  const tbdLabel = createElement("label", {
    textContent: "tbd",
    title: "to be determined",
    className: "tbd",
  });
  const tbdCheckbox = createElement(
    "input",
    {
      type: "checkbox",
      name: "tbd",
    },
    {
      action: "tbd",
    },
  );
  tbdLabel.appendChild(tbdCheckbox);
  deleteRowBtn.dataset.momentId = id;
  deleteRowBtn.textContent = "␡";
  deleteRowBtn.title = "delete";
  deleteRowBtn.dataset.action = "delete";
  deleteRowBtn.dataset.type = MOMENTS_STORE;
  deleteRowBtn.classList.add("delete");
  deleteRowBtn.title = "delete this row";

  insertAboveBtn.textContent = "+↑";
  insertAboveBtn.dataset.action = "insert";
  insertAboveBtn.dataset.direction = "above";
  insertAboveBtn.dataset.type = MOMENTS_STORE;
  insertAboveBtn.classList.add("insert", "above");
  insertAboveBtn.title = "insert row above";

  insertBelowBtn.textContent = "+↓";
  insertBelowBtn.classList.add("insert", "below");
  insertBelowBtn.dataset.action = "insert";
  insertBelowBtn.dataset.direction = "below";
  insertBelowBtn.dataset.type = MOMENTS_STORE;
  insertBelowBtn.title = "insert row below";

  return [insertAboveBtn, insertBelowBtn, deleteRowBtn, tbdLabel];
}

function createSelectEl(
  momentId: number,
  options: { label: string; value: string; color?: string }[],
  fieldName: string,
  selectedId?: number,
  padSize?: "xs" | "s" | "m" | "l",
  className?: string,
): HTMLSelectElement {
  const select = document.createElement("select");
  select.name = fieldName;
  if (className) select.classList.add(className);

  select.dataset.id = String(momentId);
  if (padSize) select.classList.add(`pad-${padSize}`);

  // const colorStyles = options.map(
  //   (skill, i) => `--color-${i + 1}: ${skill.color}`,
  // );
  // select.style = colorStyles.join(";");

  const firstOption = createElement("option", {
    textContent: "-- select --",
    value: "0",
  });
  select.appendChild(firstOption);
  options.forEach((skill) => {
    const option = document.createElement("option");
    option.value = skill.value;
    option.textContent = skill.label;
    const isSelected = skill.value === String(selectedId);
    option.selected = isSelected;

    if (isSelected)
      select.style.setProperty("--color", skill.color || "orange");
    select.appendChild(option);
  });

  return select;
}

export function createEmptyMoment(
  timeline_uuid: string,
  partial?: Partial<TimelineMoment>,
): Omit<TimelineMoment, "id"> {
  return {
    start: 0,
    end: 0,
    desc: "",
    skill_id: 1,
    group_id: 1,
    note: "",
    tbd: false,
    timeline_uuid,
    ...partial,
  };
}

export function timeMomentRowEl(
  moment: TimelineMoment,
  skills: TimelineSkill[],
  groups: TimelineGroup[],
  steps: MomentStep[] | undefined,
): HTMLTableRowElement[] {
  // const fragment = document.createDocumentFragment();
  const { id, start, end, desc, skill_id, group_id, note, tbd } = moment;

  const tr = document.createElement("tr");
  tr.id = `timeline-moment-anchor-${id}`;
  tr.dataset.momentId = String(id);
  // TODO animation is annoying because of reactivity
  // tr.classList.add("time-moment-row");
  tr.classList.add("time-moment-row", "anim--slide-in-left-right");
  tr.dataset.tbd = tbd ? "true" : "false";

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
      skills.map((s) => ({
        label: `${s.icon} ${s.name}`,
        value: String(s.id),
        color: s.color,
      })),
      "skill_id",
      skill_id,
      "xs",
      "color-code",
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
    "xs",
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
  const [insertAboveBtn, insertBelowBtn, deleteRowBtn, tbdLabel] =
    createActionButtons(String(id));
  const tbdCheckbox = tbdLabel.querySelector(
    'input[name="tbd"]',
  ) as HTMLInputElement;
  tbdCheckbox.checked = moment.tbd ? true : false;
  tdActions.append(insertAboveBtn, insertBelowBtn, deleteRowBtn, tbdLabel);

  tr.append(tdTime, tdDesc, tdSkill, tdGroup, tdNote, tdActions);

  const trSub = createSubRowSteps(steps || [], moment.id);
  // fragment.append(tr, trSub);
  return [tr, trSub];
}
