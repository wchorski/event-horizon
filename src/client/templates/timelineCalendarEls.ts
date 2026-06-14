import type { TimelineState } from "@ty/Schema";

// TODO audit this AI bullshit

export function timelineCalendarEls(timelineState: TimelineState) {
  const { moments, skills } = timelineState;

  const PX_PER_MIN = 2.2;
  const FIRST_MIN = Math.min(...moments.map((m) => m.start));
  const LAST_MIN = Math.max(...moments.map((m) => m.end));
  const TOTAL_H = (LAST_MIN - FIRST_MIN) * PX_PER_MIN;

  function toY(mins: number) {
    return (mins - FIRST_MIN) * PX_PER_MIN;
  }
  function toH(mins: number) {
    return mins * PX_PER_MIN;
  }

  function fmtTime(mins: number) {
    const h = Math.floor(mins / 60),
      m = mins % 60;
    const ampm = h < 12 ? "AM" : "PM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  // Column headers
  const colHeaders = document.getElementById("col-headers")!;
  skills.forEach((s) => {
    const el = document.createElement("div")!;
    el.className = "col-header";
    if (s.color) el.style.color = s.color;
    el.innerHTML = `<span class="col-header-icon">${s.icon}</span><span class="col-header-name">${s.name}</span>`;
    colHeaders.appendChild(el);
  });

  // Time column + hour lines per skill column
  const timeCol = document.getElementById("time-col")!;
  timeCol.style.cssText += `height:${TOTAL_H}px;position:relative;`;

  const startH = Math.floor(FIRST_MIN / 60);
  const endH = Math.floor(LAST_MIN / 60);

  // Build skill columns
  const columnsArea = document.getElementById("columns-area")!;
  const skillCols = {};
  skills.forEach((s) => {
    const col = document.createElement("div");
    col.className = "skill-col";
    col.style.height = TOTAL_H + "px";
    skillCols[s.id] = col;
    columnsArea.appendChild(col);

    // Hour lines inside each col
    for (let h = startH; h <= endH; h++) {
      const hMins = h * 60;
      if (hMins < FIRST_MIN || hMins > LAST_MIN) continue;
      const line = document.createElement("div");
      line.className = "hour-line";
      line.style.top = toY(hMins) + "px";
      col.appendChild(line);
    }
  });

  // Hour labels in time col
  for (let h = startH; h <= endH; h++) {
    const hMins = h * 60;
    if (hMins < FIRST_MIN || hMins > LAST_MIN) continue;
    const lbl = document.createElement("div");
    lbl.className = "hour-label";
    lbl.style.top = toY(hMins) + "px";
    const ampm = h < 12 ? "AM" : "PM";
    lbl.textContent = `${h % 12 || 12} ${ampm}`;
    timeCol.appendChild(lbl);
  }

  // Within each skill column, detect overlaps and sub-divide into lanes
  // Group moments by skill
  const bySkill = {};
  skills.forEach((s) => (bySkill[s.id] = []));
  moments.forEach((m) => {
    if (bySkill[m.skill_id]) bySkill[m.skill_id].push(m);
  });

  const tooltip = document.getElementById("tooltip")!;
  const ttTitle = document.getElementById("tt-title")!;
  const ttDetail = document.getElementById("tt-detail")!;

  skills.forEach((skill) => {
    const col = skillCols[skill.id];
    const skMoments = [...(bySkill[skill.id] || [])].sort(
      (a, b) => a.start - b.start,
    );

    // Assign lanes within this skill column
    // Two moments overlap if one starts before the other ends (strict: end==start is touching, not overlapping)
    const lanes = [];
    const momentLane = {};

    skMoments.forEach((m) => {
      let placed = false;
      for (let l = 0; l < lanes.length; l++) {
        // Lane is free if last moment in it ended <= m.start (touching is ok)
        if (lanes[l] <= m.start) {
          lanes[l] = m.end;
          momentLane[m.id] = l;
          placed = true;
          break;
        }
      }
      if (!placed) {
        momentLane[m.id] = lanes.length;
        lanes.push(m.end);
      }
    });

    const numLanes = Math.max(1, lanes.length);

    skMoments.forEach((m) => {
      const top = toY(m.start);
      // Height: pixel-perfect so end of one = start of next with no gap/overlap
      // We use toY(m.end) - toY(m.start) which is exactly (end-start)*PX_PER_MIN
      const height = Math.max(30, toH(m.end - m.start));
      const lane = momentLane[m.id];
      const lPct = (lane / numLanes) * 100;
      const wPct = (1 / numLanes) * 100;

      const block = document.createElement("div");
      block.className = "moment-block";

      // Override left/right to use lanes within column; 1px gap between lanes
      block.style.cssText = `top:${top}px;height:${height}px;left:calc(${lPct}% + 2px);width:calc(${wPct}% - ${numLanes > 1 ? 4 : 4}px);border-radius:3px;`;

      const inner = document.createElement("div");
      inner.className = "moment-inner";
      inner.style.cssText = `background:${skill.color}22;border-left:3px solid ${skill.color};height:100%;`;
      
      if(skill.color) inner.style.setProperty('--bg-color', skill.color)

      const descEl = document.createElement("a")!;
      descEl.className = "moment-desc";
      if (skill.color) descEl.style.color = skill.color;
      descEl.textContent = m.desc;
      descEl.href = `#timeline-moment-anchor-${m.id}`;
      inner.appendChild(descEl);

      if (height >= 28) {
        const timeEl = document.createElement("div");
        timeEl.className = "moment-time";
        if (skill.color) timeEl.style.color = skill.color;
        timeEl.textContent = `${fmtTime(m.start)}–${fmtTime(m.end)} (${m.end - m.start}m)`;
        inner.appendChild(timeEl);
      }

      block.appendChild(inner);

      block.addEventListener("mouseenter", () => {
        ttTitle.textContent = m.desc;
        ttDetail.textContent = `${fmtTime(m.start)} – ${fmtTime(m.end)} · ${m.end - m.start} min · ${skill.name}`;
        tooltip.style.display = "block";
      });
      block.addEventListener("mousemove", (e) => {
        tooltip.style.left = e.clientX + 12 + "px";
        tooltip.style.top = e.clientY - 8 + "px";
      });
      block.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
      });

      col.appendChild(block);
    });
  });
}
