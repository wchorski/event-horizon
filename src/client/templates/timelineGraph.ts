// src/client/templates/timelineGraph.ts
import { formatTimeMinutesToClockString } from "@lib/timeFormatters";
import type { BlockPlanner } from "@ty/Schema";

interface Skill {
  id: number;
  name: string;
}

interface TimelineGraphOptions {
  start?: number; // viewport start hour
  end?: number; // viewport end hour
  skills: Skill[];
  blocks: BlockPlanner[];
}

const stepMinutes = 15;
const tickEvery = 60;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function computeTicks(viewStartMin: number, viewEndMin: number, cols: number) {
  let firstTick = Math.ceil(viewStartMin / 60) * 60;
  if (viewStartMin % 60 === 0) firstTick = viewStartMin;

  const ticks: { time: number; colLine: number }[] = [];
  for (let t = firstTick; t <= viewEndMin; t += tickEvery) {
    const offset = t - viewStartMin;
    const colLine = Math.round(offset / stepMinutes) + 1;
    ticks.push({ time: t, colLine });
  }
  return ticks;
}

function computeBlockFormats(
  blocks: BlockPlanner[],
  viewStartMin: number,
  viewEndMin: number,
  maxLine: number,
  laneIndex: Map<number, number>,
) {
  return blocks
    .filter((b) => b.end > viewStartMin && b.start < viewEndMin)
    .map((b) => {
      const clampedStart = Math.max(b.start, viewStartMin);
      const clampedEnd = Math.min(b.end, viewEndMin);
      const startOffset = clampedStart - viewStartMin;
      const endOffset = clampedEnd - viewStartMin;

      let c1 = Math.floor(startOffset / stepMinutes) + 1;
      let c2 = Math.ceil(endOffset / stepMinutes) + 1;
      c1 = clamp(c1, 1, maxLine - 1);
      c2 = clamp(Math.max(c1 + 1, c2), 2, maxLine);

      const r = laneIndex.get(b.skill_id) ?? 1;
      return { block: b, c1, c2, r };
    });
}

// --- Element builders ---

function createHourLine(colLine: number): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "hour-line";
  el.style.setProperty("--c", String(colLine));
  el.setAttribute("aria-hidden", "true");
  return el;
}

function createYAxis(skill: Skill, row: number): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "y-axis";
  el.style.gridRow = String(row);
  el.title = skill.name;
  el.textContent = skill.name;
  return el;
}

function createTimeBlock(
  block: BlockPlanner,
  c1: number,
  c2: number,
  r: number,
): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.className = "time-block";
  wrapper.style.setProperty("--c1", String(c1));
  wrapper.style.setProperty("--c2", String(c2));
  wrapper.style.setProperty("--r", String(r));
  wrapper.title = `${block.desc} ${formatTimeMinutesToClockString(block.start, true)}–${formatTimeMinutesToClockString(block.end, true)} • skill:${block.skill_id}`;

  const title = document.createElement("div");
  const titleLink = document.createElement("a");
  title.className = "time-block__title";
  titleLink.textContent = block.desc;
  titleLink.href = `#timeline-block-anchor-${block.id}`;
  title.appendChild(titleLink);

  const meta = document.createElement("div");
  meta.className = "time-block__meta";
  meta.textContent = `${formatTimeMinutesToClockString(block.start, true)}–${formatTimeMinutesToClockString(block.end, true)}`;

  wrapper.appendChild(title);
  wrapper.appendChild(meta);
  return wrapper;
}

function createXTick(tick: { time: number; colLine: number }): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "x-tick";
  el.style.setProperty("--c", String(tick.colLine));

  const label = document.createElement("span");
  label.className = "x-tick__label";
  label.textContent = formatTimeMinutesToClockString(tick.time, true);

  el.appendChild(label);
  return el;
}

// --- Main render function ---

export function renderTimelineGraph(
  container: HTMLElement,
  { start = 0, end = 24, skills, blocks }: TimelineGraphOptions,
): void {
  const viewStartMin = start * 60;
  const viewEndMin = end * 60;
  const cols = Math.ceil((viewEndMin - viewStartMin) / stepMinutes);
  const lanes = skills.length;
  const maxLine = cols + 1;
  const laneIndex = new Map(skills.map((s, i) => [s.id, i + 1]));

  const ticks = computeTicks(viewStartMin, viewEndMin, cols);
  const blockFormats = computeBlockFormats(
    blocks,
    viewStartMin,
    viewEndMin,
    maxLine,
    laneIndex,
  );

  // Update grid CSS vars
  container.style.setProperty("--cols", String(cols));
  container.style.setProperty("--lanes", String(lanes));

  container.replaceChildren();

  // Hour lines
  ticks.forEach((t) => container.appendChild(createHourLine(t.colLine)));

  // Y-axis skill labels
  skills.forEach((skill, i) =>
    container.appendChild(createYAxis(skill, i + 1)),
  );

  // Time blocks
  blockFormats.forEach(({ block, c1, c2, r }) =>
    container.appendChild(createTimeBlock(block, c1, c2, r)),
  );

  // X-axis ticks
  ticks.forEach((t) => container.appendChild(createXTick(t)));
}
