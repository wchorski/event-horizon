// @client/draggableMomentRow.ts
const tbody = document.getElementById('time-moment-list') as HTMLTableSectionElement | null;

if (!tbody) {
  throw new Error('Element with id "time-moment-list" not found');
}

interface DropTarget {
  row: HTMLTableRowElement;
  isBelow: boolean;
}

interface PairBounds {
  top: number;
  bottom: number;
  stepsRow: HTMLTableRowElement | null;
}

let draggedMomentRow: HTMLTableRowElement | null = null;
let draggedStepsRow: HTMLTableRowElement | null = null;
let dropTarget: DropTarget | null = null;

// The steps row is always the very next sibling of its moment row
function getStepsRow(momentRow: HTMLTableRowElement): HTMLTableRowElement | null {
  const next = momentRow.nextElementSibling;
  if (
    next instanceof HTMLTableRowElement &&
    next.classList.contains('time-moment-steps') &&
    next.dataset.momentId === momentRow.dataset.momentId
  ) {
    return next;
  }
  return null;
}

// Normalize: whatever <tr> we hovered/dropped on, resolve to its moment row
function getMomentRow(tr: HTMLTableRowElement | null): HTMLTableRowElement | null {
  if (!tr) return null;
  if (tr.classList.contains('time-moment-row')) return tr;
  if (tr.classList.contains('time-moment-steps')) {
    return tbody!.querySelector<HTMLTableRowElement>(
      `.time-moment-row[data-moment-id="${tr.dataset.momentId}"]`
    );
  }
  return null;
}

function clearIndicators(): void {
  tbody!
    .querySelectorAll<HTMLTableRowElement>('.time-moment-row, .time-moment-steps')
    .forEach((r) => r.classList.remove('drag-over-top', 'drag-over-bottom'));
}

// Treat a moment row + its steps row as one visual block for hit-testing
function pairBounds(momentRow: HTMLTableRowElement): PairBounds {
  const stepsRow = getStepsRow(momentRow);
  const topRect = momentRow.getBoundingClientRect();
  const bottomRect = stepsRow ? stepsRow.getBoundingClientRect() : topRect;
  return { top: topRect.top, bottom: bottomRect.bottom, stepsRow };
}

function cleanup(): void {
  if (draggedMomentRow) draggedMomentRow.classList.remove('dragging');
  if (draggedStepsRow) draggedStepsRow.classList.remove('dragging-steps');
  clearIndicators();
  draggedMomentRow = null;
  draggedStepsRow = null;
  dropTarget = null;
}

tbody.addEventListener('dragstart', (e: DragEvent) => {
  const target = e.target as HTMLElement;
  const handle = target.closest<HTMLElement>('[data-action="drag"]');
  if (!handle) {
    e.preventDefault();
    return;
  }

  const momentRow = handle.closest<HTMLTableRowElement>('tr.time-moment-row');
  if (!momentRow) return;

  draggedMomentRow = momentRow;
  draggedStepsRow = getStepsRow(momentRow);

  draggedMomentRow.classList.add('dragging');
  if (draggedStepsRow) draggedStepsRow.classList.add('dragging-steps');

  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
    // Ghost preview: only the moment row, never the steps row
    e.dataTransfer.setDragImage(draggedMomentRow, 20, 20);
  }
});

tbody.addEventListener('dragover', (e: DragEvent) => {
  e.preventDefault();

  const target = e.target as HTMLElement;
  const hovered = target.closest<HTMLTableRowElement>('tr');
  const targetMomentRow = getMomentRow(hovered);
  if (!targetMomentRow || targetMomentRow === draggedMomentRow) return;

  clearIndicators();

  const { top, bottom, stepsRow: targetStepsRow } = pairBounds(targetMomentRow);
  const isBelow = e.clientY > top + (bottom - top) / 2;

  if (isBelow) {
    // draw the line under the WHOLE pair, never between moment + its own steps
    (targetStepsRow ?? targetMomentRow).classList.add('drag-over-bottom');
  } else {
    targetMomentRow.classList.add('drag-over-top');
  }

  dropTarget = { row: targetMomentRow, isBelow };
});

tbody.addEventListener('drop', (e: DragEvent) => {
  e.preventDefault();
  if (!dropTarget || !draggedMomentRow) return;

  const { row: targetMomentRow, isBelow } = dropTarget;
  const targetStepsRow = getStepsRow(targetMomentRow);

  swapMomentTimes(draggedMomentRow, targetMomentRow);

  if (isBelow) {
    // insert after target's pair (past its steps row, if any)
    (targetStepsRow ?? targetMomentRow).after(draggedMomentRow);
  } else {
    targetMomentRow.before(draggedMomentRow);
  }

  // keep the steps row glued directly beneath its moment row
  if (draggedStepsRow) draggedMomentRow.after(draggedStepsRow);

  cleanup();
});

tbody.addEventListener('dragend', cleanup);

function getTimeInputs(
  momentRow: HTMLTableRowElement
): { start: HTMLInputElement; end: HTMLInputElement } | null {
  const start = momentRow.querySelector<HTMLInputElement>('input[name="start"]');
  const end = momentRow.querySelector<HTMLInputElement>('input[name="end"]');
  if (!start || !end) return null;
  return { start, end };
}

function swapMomentTimes(
  rowA: HTMLTableRowElement,
  rowB: HTMLTableRowElement
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

  // initiates local save to idb
  [inputsA.start, inputsA.end, inputsB.start, inputsB.end].forEach((input) => {
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}