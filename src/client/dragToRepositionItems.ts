// @client/dragToRepositionItems.ts
import { generateKeyBetween } from "@client/fractional-keys";
import { idbUpdateStep } from "@client/indexedDB"; // adjust to your actual export path
import type { MomentStep } from "@ty/Schema";

const tbody = document.getElementById(
  "time-moment-list",
) as HTMLTableSectionElement | null;

if (!tbody) {
  throw new Error('Element with id "time-moment-list" not found');
}

/*
  Assumed markup for steps (adjust selectors below if yours differs):

  <tr class="time-moment-steps" data-moment-id="5">
    <td colspan="...">
      <ul class="step-list" data-moment-id="5">
        <li class="step-item" data-step-id="12" data-position="a0" draggable="true">
          <span data-action="drag-step">::</span>
          ...
        </li>
      </ul>
    </td>
  </tr>

  Moment rows keep using [data-action="drag"] as their handle, unchanged.
  Steps use [data-action="drag-step"] as their handle, scoped to '.step-item'
  inside the nearest '.step-list'.
*/

const STEP_ITEM_SELECTOR = "li.step[data-step-id]";
const STEP_LIST_SELECTOR = "ul.steps";
const STEP_HANDLE_SELECTOR = '[data-action="drag-step"]';
const MOMENT_HANDLE_SELECTOR = '[data-action="drag"]';

interface DropTarget {
  row: HTMLTableRowElement;
  isBelow: boolean;
}

interface PairBounds {
  top: number;
  bottom: number;
  stepsRow: HTMLTableRowElement | null;
}

type DragMode = "moment" | "step" | null;

let dragMode: DragMode = null;

// --- moment-drag state ---
let draggedMomentRow: HTMLTableRowElement | null = null;
let draggedStepsRow: HTMLTableRowElement | null = null;
let dropTarget: DropTarget | null = null;

// --- step-drag state ---
let draggedStepEl: HTMLElement | null = null;
let draggedStepId: number | null = null;

// ============================================================
// Shared helpers (moment-level) — unchanged from before
// ============================================================

function getStepsRow(
  momentRow: HTMLTableRowElement,
): HTMLTableRowElement | null {
  const next = momentRow.nextElementSibling;
  if (
    next instanceof HTMLTableRowElement &&
    next.classList.contains("time-moment-steps") &&
    next.dataset.momentId === momentRow.dataset.momentId
  ) {
    return next;
  }
  return null;
}

function getMomentRow(
  tr: HTMLTableRowElement | null,
): HTMLTableRowElement | null {
  if (!tr) return null;
  if (tr.classList.contains("time-moment-row")) return tr;
  if (tr.classList.contains("time-moment-steps")) {
    return tbody!.querySelector<HTMLTableRowElement>(
      `.time-moment-row[data-moment-id="${tr.dataset.momentId}"]`,
    );
  }
  return null;
}

function clearIndicators(): void {
  tbody!
    .querySelectorAll<HTMLTableRowElement>(
      ".time-moment-row, .time-moment-steps",
    )
    .forEach((r) => r.classList.remove("drag-over-top", "drag-over-bottom"));
}

function pairBounds(momentRow: HTMLTableRowElement): PairBounds {
  const stepsRow = getStepsRow(momentRow);
  const topRect = momentRow.getBoundingClientRect();
  const bottomRect = stepsRow ? stepsRow.getBoundingClientRect() : topRect;
  return { top: topRect.top, bottom: bottomRect.bottom, stepsRow };
}

// ============================================================
// Step-level helpers (new)
// ============================================================

function clearStepIndicators(): void {
  tbody!
    .querySelectorAll<HTMLElement>(STEP_ITEM_SELECTOR)
    .forEach((el) =>
      el.classList.remove("step-drag-over-top", "step-drag-over-bottom"),
    );
}

function getStepAfterPointer(
  listEl: HTMLElement,
  pointerY: number,
): HTMLElement | null {
  const candidates = Array.from(
    listEl.querySelectorAll<HTMLElement>(
      `${STEP_ITEM_SELECTOR}:not(.step-dragging)`,
    ),
  );

  return candidates.reduce<{ offset: number; element: HTMLElement | null }>(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = pointerY - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null },
  ).element;
}

async function persistStepPosition(
  stepId: number,
  position: string,
): Promise<void> {
  try {
    await idbUpdateStep(stepId, { position } as Partial<MomentStep>);
  } catch (err) {
    console.error(`Failed to persist reorder for step ${stepId}:`, err);
  }
}

// ============================================================
// dragstart — dispatch by handle type, THEN fall back to cancel
// ============================================================

let lastPointerDownTarget: HTMLElement | null = null;

tbody.addEventListener("pointerdown", (e: PointerEvent) => {
  
  lastPointerDownTarget = e.target as HTMLElement;
});

tbody.addEventListener("dragstart", (e: DragEvent) => {

  const target = e.target as HTMLElement;
  const stepHandle =
    lastPointerDownTarget?.closest<HTMLElement>(STEP_HANDLE_SELECTOR) ?? null;

  if (stepHandle) {
    const stepEl = stepHandle.closest<HTMLElement>(STEP_ITEM_SELECTOR);
    if (!stepEl) {
      e.preventDefault();
      return;
    }

    dragMode = "step";
    draggedStepEl = stepEl;
    draggedStepId = Number(stepEl.dataset.stepId);
    stepEl.classList.add("step-dragging");

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", stepEl.dataset.stepId ?? "");
    }
    return;
  }

  const momentHandle = target.closest<HTMLElement>(MOMENT_HANDLE_SELECTOR);
  if (!momentHandle) {
    // neither handle matched — this drag didn't originate from a
    // recognized drag source, so cancel it
    e.preventDefault();
    return;
  }

  const momentRow =
    momentHandle.closest<HTMLTableRowElement>("tr.time-moment-row");
  if (!momentRow) return;

  dragMode = "moment";
  draggedMomentRow = momentRow;
  draggedStepsRow = getStepsRow(momentRow);

  draggedMomentRow.classList.add("dragging");
  if (draggedStepsRow) draggedStepsRow.classList.add("dragging-steps");

  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "");
    e.dataTransfer.setDragImage(draggedMomentRow, 20, 20);
  }
});

// ============================================================
// dragover — dispatch by active mode
// ============================================================

tbody.addEventListener("dragover", (e: DragEvent) => {
  e.preventDefault();

  if (dragMode === "step") {

    if (!draggedStepEl) return;

    const target = e.target as HTMLElement;
    const listEl = target.closest<HTMLElement>(STEP_LIST_SELECTOR);

    const draggedList = draggedStepEl.closest<HTMLElement>(STEP_LIST_SELECTOR);

    // only allow reordering within the same moment's step list
    if (!listEl || listEl !== draggedList) return;

    clearStepIndicators();

    const afterEl = getStepAfterPointer(listEl, e.clientY);
    if (afterEl == null) {
      listEl.appendChild(draggedStepEl);
    } else if (afterEl !== draggedStepEl) {
      listEl.insertBefore(draggedStepEl, afterEl);
    }
    return;
  }

  if (dragMode === "moment") {
    const target = e.target as HTMLElement;
    const hovered = target.closest<HTMLTableRowElement>("tr");
    const targetMomentRow = getMomentRow(hovered);
    if (!targetMomentRow || targetMomentRow === draggedMomentRow) return;

    clearIndicators();

    const {
      top,
      bottom,
      stepsRow: targetStepsRow,
    } = pairBounds(targetMomentRow);
    const isBelow = e.clientY > top + (bottom - top) / 2;

    if (isBelow) {
      (targetStepsRow ?? targetMomentRow).classList.add("drag-over-bottom");
    } else {
      targetMomentRow.classList.add("drag-over-top");
    }

    dropTarget = { row: targetMomentRow, isBelow };
  }
});

// ============================================================
// drop — dispatch by active mode
// ============================================================

tbody.addEventListener("drop", (e: DragEvent) => {
  e.preventDefault();

  if (dragMode === "step") {
    if (!draggedStepEl || draggedStepId == null) return;

    const listEl = draggedStepEl.closest<HTMLElement>(STEP_LIST_SELECTOR);
    if (!listEl) return;

    const siblings = Array.from(
      listEl.querySelectorAll<HTMLElement>(STEP_ITEM_SELECTOR),
    );
    const idx = siblings.indexOf(draggedStepEl);

    const beforeEl = siblings[idx - 1] ?? null;
    const afterEl = siblings[idx + 1] ?? null;

    const beforePosition = beforeEl?.dataset.position ?? null;
    const afterPosition = afterEl?.dataset.position ?? null;

    const newPosition = generateKeyBetween(beforePosition, afterPosition);
    draggedStepEl.dataset.position = newPosition;

    void persistStepPosition(draggedStepId, newPosition);

    stepCleanup();
    return;
  }

  if (dragMode === "moment") {
    if (!dropTarget || !draggedMomentRow) return;

    const { row: targetMomentRow, isBelow } = dropTarget;
    const targetStepsRow = getStepsRow(targetMomentRow);

    swapMomentTimes(draggedMomentRow, targetMomentRow);

    if (isBelow) {
      (targetStepsRow ?? targetMomentRow).after(draggedMomentRow);
    } else {
      targetMomentRow.before(draggedMomentRow);
    }

    if (draggedStepsRow) draggedMomentRow.after(draggedStepsRow);

    momentCleanup();
  }
});

// ============================================================
// dragend — dispatch by active mode
// ============================================================

tbody.addEventListener("dragend", () => {
  if (dragMode === "step") {
    stepCleanup();
  } else if (dragMode === "moment") {
    momentCleanup();
  }
});

function stepCleanup(): void {
  draggedStepEl?.classList.remove("step-dragging");
  clearStepIndicators();
  draggedStepEl = null;
  draggedStepId = null;
  dragMode = null;
}

function momentCleanup(): void {
  if (draggedMomentRow) draggedMomentRow.classList.remove("dragging");
  if (draggedStepsRow) draggedStepsRow.classList.remove("dragging-steps");
  clearIndicators();
  draggedMomentRow = null;
  draggedStepsRow = null;
  dropTarget = null;
  dragMode = null;
}

function getTimeInputs(
  momentRow: HTMLTableRowElement,
): { start: HTMLInputElement; end: HTMLInputElement } | null {
  const start = momentRow.querySelector<HTMLInputElement>(
    'input[name="start"]',
  );
  const end = momentRow.querySelector<HTMLInputElement>('input[name="end"]');
  if (!start || !end) return null;
  return { start, end };
}

function swapMomentTimes(
  rowA: HTMLTableRowElement,
  rowB: HTMLTableRowElement,
): void {
  const inputsA = getTimeInputs(rowA);
  const inputsB = getTimeInputs(rowB);
  if (!inputsA || !inputsB) return;

  const aStart = inputsA.start.value;
  const aEnd = inputsA.end.value;
  const bStart = inputsB.start.value;
  const bEnd = inputsB.end.value;

  inputsA.start.value = bStart;
  inputsA.end.value = bEnd;
  inputsB.start.value = aStart;
  inputsB.end.value = aEnd;

  [inputsA.start, inputsA.end, inputsB.start, inputsB.end].forEach((input) => {
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
