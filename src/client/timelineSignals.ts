console.log("--- script timelineSignals ---");
import {
  idbCreateMoment,
  idbDeleteMoment,
  idbUpdateMoment,
  idbCreateTimelineSkill,
  idbUpdateTimeSkill,
  idbDeleteTimeSkill,
  idbUpdateTimeGroup,
  idbCreateTimelineGroup,
  idbDeleteTimeGroup,
  idbUpdateStep,
  idbCreateStep,
  idbDeleteStep,
  idbGetSingleTimelineData,
  idbUpdateTimeline,
} from "@client/indexedDB";
import { seedIfEmpty } from "@client/initTimelineDB";
import {
  createEmptyMoment,
  createStepEl,
  timeMomentRowEl,
} from "@client/templates/timeMomentRow";
import { groupCard } from "@client/templates/groupCard";
import type {
  BtnAction,
  BtnDirection,
  TimelineSkill,
  MomentStep,
  Timeline,
  TimelineBtnAction,
  TimelineState,
  TimelineMoment,
  TimelineGroup,
} from "@ty/Schema";

import { debounce } from "@lib/wait";
import { MOMENTS_STORE, STEPS_STORE } from "@client/indexedDB";
import { downloadAsJSON } from "@client/downloadOnClient";
import { prettyDateToLocale } from "@lib/formatters";
import { createStore } from "@client/stores";
import { skillListItem } from "@client/templates/skillListItem";

const pageHeader = document.getElementById("page-header")!;
const timelineRevSpan = document.getElementById("timeline-revision")!;
const divTimelineGraph = document.getElementById("timeline");
const table = document.getElementById("timeline-moment-table")!;
const tbody = document.getElementById("time-moment-list")!;
const skillList = document.getElementById("skills-list")!;
const groupsList = document.getElementById("time-groups-list")!;
const skillCreateBtn = document.getElementById("create-skill-item")!;
const groupCreateBtn = document.getElementById("create-group-item")!;
const momentCreateBtn = document.getElementById("create-moment-item")!;
const bannerMsgP = document.getElementById("banner-message")!;
// let timelineData: TimelineData | null = null;

const timeline_uuid = window.location.pathname.split("/").at(-1);

async function fetchIdbData() {
  if (!timeline_uuid)
    throw new Error(
      `timeline_uuid: ${timeline_uuid}. how did you even get here?`,
    );
  try {
    await seedIfEmpty().catch((e) => console.error(`seedIfEmpty: ${e}`));
    return await idbGetSingleTimelineData(timeline_uuid);
  } catch (error) {
    bannerMsgP.textContent = String(error);
    throw new Error(`fetchIdbData, ${error}`);
  }
}

const tmlnData = await fetchIdbData();

// const { skills, groups, moments } = tmlnData;
if (!timeline_uuid) throw new Error("no uuid");

import {
  signal,
  computed,
  effect,
  untracked,
  collection,
} from "@client/signals";

const {
  moments: m,
  steps: st,
  groups: g,
  skills: sk,
  ...timelineFields
} = tmlnData;

const timeline = signal<Timeline>(timelineFields);
const moments = collection<TimelineMoment>(m);
const skills = collection<TimelineSkill>(sk);
const groups = collection<TimelineGroup>(g);
const steps = collection<MomentStep>(st);

const sortedMoments = computed(() =>
  [...moments.value].sort((a, b) => a.start - b.start),
);
// const momentIds = computed(() =>
//   sortedMoments.value
//     .map((m) => `${m.id}:${m.skill_id}:${m.group_id}`)
//     .join(","),
// );

initTimelineUI(timeline.value);
renderMomentsUI(sortedMoments.value, skills.value, groups.value, steps.value);
renderGraphUI(moments.value, skills.value);
renderSkillsUI(skills.value);
renderGroupsUI(groups.value, sortedMoments.value);

effect(() => uiTimelineMeta(timeline.value));

moments.onChange((change) => {
  switch (change.type) {
    case "added": {
      const [tr] = timeMomentRowEl(change.item, skills.value, groups.value, []);
      tr.dataset.momentId = String(change.item.id);
      tbody.appendChild(tr);
      break;
    }
    case "inserted":
      // DOM placement handled at call site — only graph needs updating
      renderGraphUI(moments.value, skills.value);
      break;
    case "removed":
      const trs = tbody.querySelectorAll(`tr[data-moment-id="${change.id}"]`)!;
      // remove moment and sibling steps rows
      trs.forEach((tr) => tr.remove());
      break;
    case "updated":
      renderGraphUI(moments.value, skills.value);
      // if group assignment changed, re-render the groups UI
      const previous = moments.value.find((m) => m.id === change.item.id);
      if (previous?.group_id !== change.item.group_id) {
        renderGroupsUI(groups.value, moments.value);
      }
      break;
    case "reordered":
      renderMomentsUI(moments.value, skills.value, groups.value, steps.value);
      break;
  }
});

skills.onChange((change) => {
  switch (change.type) {
    case "added": {
      const li = skillListItem(change.item);
      li.dataset.skillId = String(change.item.id);
      skillList.appendChild(li);
      tbody
        .querySelectorAll<HTMLSelectElement>("select[name='skill_id']")
        .forEach((sel) => {
          const opt = document.createElement("option");
          opt.value = String(change.item.id);
          opt.textContent = change.item.name;
          sel.appendChild(opt);
        });
      break;
    }
    case "inserted":
      // DOM placement handled at call site — only graph needs updating
      renderGraphUI(moments.value, skills.value);
      break;
    case "removed":
      skillList.querySelector(`li[data-skill-id="${change.id}"]`)?.remove();
      const options = tbody.querySelectorAll<HTMLOptionElement>(
        `select[name='skill_id'] option[value="${change.id}"]`,
      );
      options.forEach((o) => o.remove());
      renderGraphUI(moments.value, skills.value);
      break;
    case "updated": {
      const li = skillList.querySelector(
        `li[data-skill-id="${change.item.id}"]`,
      );
      // only replace the element if it's a structural change (name shown in table options)
      // not a field edit from within the list itself
      if (li && !change.fromSelf) {
        li.replaceWith(skillListItem(change.item));
      }
      tbody
        .querySelectorAll<HTMLOptionElement>(
          `select[name='skill_id'] option[value="${change.item.id}"]`,
        )
        .forEach((opt) => {
          // TODO how to set --color on select el here?
          opt.textContent = `${change.item.icon} ${change.item.name}`;
        });
      break;
    }
  }
});

groups.onChange((change) => {
  switch (change.type) {
    case "added": {
      const div = groupCard(change.item, []);
      div.dataset.groupId = String(change.item.id);
      groupsList.appendChild(div);
      tbody
        .querySelectorAll<HTMLSelectElement>("select[name='group_id']")
        .forEach((sel) => {
          const opt = document.createElement("option");
          opt.value = String(change.item.id);
          opt.textContent = change.item.name;
          sel.appendChild(opt);
        });
      break;
    }
    case "inserted":
      // DOM placement handled at call site — only graph needs updating
      renderGraphUI(moments.value, skills.value);
      break;
    case "removed":
      groupsList.querySelector(`[data-group-id="${change.id}"]`)?.remove();
      const options = tbody.querySelectorAll<HTMLOptionElement>(
        `select[name='group_id'] option[value="${change.id}"]`,
      );
      options.forEach((o) => o.remove());
      break;
    case "updated": {
      const el = groupsList.querySelector(
        `[data-group-id="${change.item.id}"]`,
      );
      // fromSelf do not re render if editing direct card input field
      if (el && !change.fromSelf)
        el.replaceWith(
          groupCard(
            change.item,
            moments.value.filter((m) => m.group_id === change.item.id),
          ),
        );
      tbody
        .querySelectorAll<HTMLOptionElement>(
          `select[name='group_id'] option[value="${change.item.id}"]`,
        )
        .forEach((opt) => {
          opt.textContent = change.item.name;
        });
      break;
    }
  }
});

// Mutations
pageHeader.addEventListener("input", (e) => {
  const target = e.target as HTMLInputElement;
  if (!target.matches("input, textarea")) return;
  const field = target.name;
  if (!field) return;
  debouncedSaveTimeline(timeline.value.id, field, target.value);
});
momentCreateBtn.addEventListener("pointerup", async (e) => {
  // TODO don't need to do this if i have them always sorted
  const lastMoment =
    moments.value.length > 0
      ? moments.value.reduce((max, m) => (m.start > max.start ? m : max))
      : { start: 0, end: 0 };

  const created = await idbCreateMoment({
    desc: "",
    timeline_uuid,
    note: "",
    start: lastMoment.end,
    end: lastMoment.end + 15,
    skill_id: skills.value[0]?.id || 0,
    group_id: groups.value[0]?.id || 0,
  });
  moments.add(created);

  // const [tr] = timeMomentRowEl(newMoment, skills.value, groups, []);
  // tr.dataset.momentId = String(newMoment.id);
  // tbody.appendChild(tr);
});
table.addEventListener("input", (e) => {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement;
  if (!target.matches("input, textarea")) return;

  const stepItem = target.closest("li[data-step-id]");
  if (stepItem) {
    const stepId = Number((stepItem as HTMLElement).dataset.stepId);
    const field = target.name as keyof MomentStep;
    debouncedSaveStep(stepId, field, target.value);
    return;
  }

  const row = target.closest("tr[data-moment-id]") as HTMLTableRowElement;
  if (!row) return;
  const momentId = Number(row.dataset.momentId);
  const field = target.name;
  if (!momentId || !field) return;

  // TODO quick bandaid to not allow checkbox 'on' value to be passed. this is handled in "change" event listener but needs to be ignored here
  //@ts-ignore
  if (!target.checked) {
    debouncedSaveMoment(momentId, field, target.value);
  }
});
// selects will have instant save, no debounce
table.addEventListener("change", async (e) => {
  const target = e.target as HTMLSelectElement | HTMLInputElement;
  if (!target.matches("select, input[type='checkbox']")) return;

  const stepItem = target.closest("li[data-step-id]");
  if (stepItem) {
    const stepId = Number((stepItem as HTMLElement).dataset.stepId);
    const field = target.name as keyof MomentStep;
    debouncedSaveStep(stepId, field, target.value);
    return;
  }

  const row = target.closest("tr")!;
  const momentId = Number(row.dataset.momentId);
  const field = target.name;
  if (!momentId || !field) return;

  if (field === "skill_id") {
    const skill = skills.value.find((s) => s.id === Number(target.value));
    target.style.setProperty("--color", skill?.color || "gray");
  }

  //@ts-ignore
  const value = !isNaN(target.checked) ? target.checked : target.value;
  const updated = await idbUpdateMoment(momentId, { [field]: value });
  moments.update(updated);
});
table.addEventListener("click", async (e) => {
  const target = e.target as HTMLElement;
  const btn = target.closest("button");
  if (!btn) return;

  const btnAction = btn.dataset.action as BtnAction;
  const btnType = btn.dataset.type;
  const btnDirection = btn.dataset.direction as BtnDirection | undefined;

  const rowEl = btn.closest("tr[data-moment-id]") as HTMLTableRowElement;
  const momentId = Number(rowEl?.dataset.momentId);

  switch (btnAction) {
    case "delete": {
      switch (btnType) {
        case MOMENTS_STORE: {
          if (isNaN(momentId))
            throw new Error(`moment id invalid: ${momentId}`);
          // delete cascaded steps from IDB first
          const momentSteps = steps.value.filter(
            (s) => s.moment_id === momentId,
          );
          await Promise.all(momentSteps.map((s) => idbDeleteStep(s.id)));
          await idbDeleteMoment(momentId);
          // update collections — effects handle DOM removal
          momentSteps.forEach((s) => steps.remove(s.id));
          moments.remove(momentId);
          break;
        }
        case STEPS_STORE: {
          const stepLi = btn.closest("li[data-step-id]")! as HTMLElement;
          const stepId = Number(stepLi?.dataset.stepId);
          if (isNaN(stepId)) throw new Error(`step id invalid: ${stepId}`);
          await idbDeleteStep(stepId);
          steps.remove(stepId);
          break;
        }
      }
      break;
    }

    case "create": {
      if (isNaN(momentId)) throw new Error(`moment id invalid: ${momentId}`);
      const newStep = await idbCreateStep({
        text: "",
        tbd: false,
        moment_id: momentId,
        note: "",
        order: 1,
      });
      steps.add(newStep);
      // Step UI is nested inside the row so append directly —
      // the steps collection doesn't own this DOM region
      const stepList = btn.closest("td")!.querySelector("ul.steps");
      stepList?.appendChild(createStepEl(newStep));
      break;
    }

    case "insert": {
      if (isNaN(momentId)) throw new Error(`moment id invalid: ${momentId}`);
      const targetMoment = moments.value.find((m) => m.id === momentId);

      let newStart = 0;
      let newEnd = 0;

      switch (btnDirection) {
        case "above":
          newStart = targetMoment ? targetMoment.start - 15 : 0;
          newEnd = targetMoment ? targetMoment.start : 0;
          break;
        case "below":
          newStart = targetMoment ? targetMoment.end : 0;
          newEnd = targetMoment ? targetMoment.end + 15 : 0;
          break;
        default:
          console.error(`unsupported direction: ${btnDirection}`);
          return;
      }

      const newMoment = await idbCreateMoment(
        createEmptyMoment(timeline_uuid, { start: newStart, end: newEnd }),
      );

      moments.insert(newMoment);

      // Insert needs positional DOM placement that collection.add can't express,
      // so we handle it directly here after the signal fires
      const [newRow, newSubRow] = timeMomentRowEl(
        newMoment,
        skills.value,
        groups.value,
        [],
      );

      switch (btnDirection) {
        case "above":
          rowEl.insertAdjacentElement("beforebegin", newRow);
          newRow.insertAdjacentElement("afterend", newSubRow);
          break;
        case "below": {
          const existingSubRow = rowEl.nextElementSibling;
          const anchor = existingSubRow ?? rowEl;
          anchor.insertAdjacentElement("afterend", newRow);
          newRow.insertAdjacentElement("afterend", newSubRow);
          break;
        }
      }
      break;
    }
  }
});
groupsList.addEventListener("input", (e) => {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement;
  if (!target.matches("input, textarea")) return;
  const cardEl = target.closest("div")!;
  const groupId = Number(cardEl.dataset.groupId);
  const field = target.name;
  if (!groupId || !field) return;
  debouncedSaveGroup(groupId, field, target.value);
});
groupsList.addEventListener("click", async (e) => {
  const target = e.target as HTMLElement;
  const btn = target.closest("button");
  if (!btn) return;
  if (btn.dataset.action !== "delete") return;

  const divEl = btn.closest("div[data-group-id]") as HTMLElement;
  const groupId = Number(divEl?.dataset.groupId);
  if (isNaN(groupId)) throw new Error(`group id invalid: ${groupId}`);

  await idbDeleteTimeGroup(groupId);
  groups.remove(groupId);
});
groupCreateBtn.addEventListener("pointerup", async (e) => {
  const created = await idbCreateTimelineGroup({
    name: "",
    timeline_uuid,
  });
  groups.add(created);
});
skillList.addEventListener("input", (e) => {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement;
  if (!target.matches("input, textarea")) return;
  const itemEl = target.closest("li")!;
  const skillId = Number(itemEl.dataset.skillId);
  const field = target.name;
  if (!skillId || !field) return;
  debouncedSaveSkill(skillId, field, target.value);
});
skillList.addEventListener("click", async (e) => {
  const target = e.target as HTMLElement;
  const btn = target.closest("button");
  if (!btn) return;
  if (btn.dataset.action !== "delete") return;

  const liEl = btn.closest("li[data-skill-id]") as HTMLElement;
  const skillId = Number(liEl?.dataset.skillId);
  if (isNaN(skillId)) throw new Error(`skill id invalid: ${skillId}`);

  await idbDeleteTimeSkill(skillId);
  skills.remove(skillId);
});
skillCreateBtn.addEventListener("pointerup", async (e) => {
  const created = await idbCreateTimelineSkill({
    name: "",
    icon: "☘",
    color: "grey",
    timeline_uuid,
  });

  skills.add(created);
});

// One caveat with this minimal implementation: activeEffect is a single global, so it's not safe for async effects. If you await inside an effect, the finally block resets activeEffect before the async work completes. Keep effects synchronous — do your await outside and just assign the signal after:
// typescript

// // ✅ correct
// const newMoment = await idbCreateMoment({ ... });
// moments.value = [...moments.value, newMoment];

// // ❌ don't do this
// effect(async () => {
//   const data = await fetchSomething();
//   // activeEffect is already null here
// });

function initTimelineUI(data: Timeline) {
  const summaryInput = pageHeader.querySelector<HTMLInputElement>(
    'input[name="summary"]',
  );
  const dateCivilInput = pageHeader.querySelector<HTMLInputElement>(
    'input[name="date_civil"]',
  );
  const timezoneInput = pageHeader.querySelector<HTMLInputElement>(
    'input[name="timezone"]',
  );
  if (!summaryInput || !dateCivilInput || !timezoneInput)
    throw new Error("timeline inputs not found");

  summaryInput.value = data.summary;
  dateCivilInput.value = data.date_civil;
  timezoneInput.value = data.timezone;
  uiTimelineMeta(data);
}
function uiTimelineMeta(data: Timeline) {
  const dateCreatedEl = pageHeader.querySelector(
    'dt[data-field="date_created"]',
  );
  const dateModifiedEl = pageHeader.querySelector(
    'dt[data-field="date_modified"]',
  );
  const revEl = pageHeader.querySelector('dt[data-field="rev"]');

  if (dateCreatedEl)
    dateCreatedEl.textContent = prettyDateToLocale(data.date_created);
  if (dateModifiedEl)
    dateModifiedEl.textContent = prettyDateToLocale(data.date_modified);
  if (revEl) revEl.textContent = String(data.rev);
  timelineRevSpan.textContent = String(data.rev);
}

function renderGraphUI(moments: TimelineMoment[], skills: TimelineSkill[]) {
  document.dispatchEvent(
    new CustomEvent("timeline:load", {
      detail: { moments, skills },
    }),
  );
}

function renderMomentsUI(
  moments: TimelineMoment[],
  skills: TimelineSkill[],
  groups: TimelineGroup[],
  steps: MomentStep[],
) {
  //   const { moments, skills, groups, steps } = tmlnData;
  tbody.replaceChildren(); // clear existing
  // no sort needed here — sortedMoments computed handles it
  moments.forEach((b) =>
    tbody.append(
      ...timeMomentRowEl(
        b,
        skills,
        groups,
        steps.filter((t) => t.moment_id === b.id),
      ),
    ),
  );
}

function renderSkillsUI(skills: TimelineSkill[]) {
  skillList.replaceChildren();
  skills.forEach((s) => {
    // const li = document.createElement("li");
    // li.textContent = s.name;
    const li = skillListItem(s);
    li.dataset.skillId = String(s.id);
    skillList.appendChild(li);
  });
}

function renderGroupsUI(groups: TimelineGroup[], moments: TimelineMoment[]) {
  groupsList.replaceChildren(); // clear before re-render
  // TODO render in li for symatics
  groups.forEach((g) =>
    groupsList.appendChild(
      groupCard(
        g,
        moments.filter((b) => b.group_id === g.id),
      ),
    ),
  );
}

const debouncedSaveMoment = debounce(
  async (momentId: number, field: string, value: string) => {
    const updated = await idbUpdateMoment(momentId, { [field]: value });
    // moments.value = moments.value.map((m) =>
    //   m.id === updated.id ? updated : m,
    // );
    moments.update(updated);
    // timelineStore.update((state) => ({
    //   ...state,
    //   moments: state.moments.map((m) => (m.id === updated.id ? updated : m)),
    // }));
  },
  500,
);
const debouncedSaveStep = debounce(
  async (momentId: number, field: string, value: string) => {
    await idbUpdateStep(momentId, { [field]: value });
  },
  500,
);
const debouncedSaveSkill = debounce(
  async (skillId: number, field: string, value: string) => {
    const updated = await idbUpdateTimeSkill(skillId, { [field]: value });
    skills.update(updated, true);
  },
  500,
);
const debouncedSaveGroup = debounce(
  async (groupId: number, field: string, value: string) => {
    const updated = await idbUpdateTimeGroup(groupId, { [field]: value });
    groups.update(updated, true);
  },
  500,
);
const debouncedSaveTimeline = debounce(
  async (uuid: string, field: string, value: string) => {
    const updated = await idbUpdateTimeline(uuid, { [field]: value }, false);
    timeline.value = updated;
  },
  500,
);
