import type {
  TimelineMoment,
  TimelineGroup,
  TimelineSkill,
  MomentStep,
  Timeline,
} from "@ty/Schema";
import {
  MOMENTS_STORE,
  GROUPS_STORE,
  openDB,
  SKILLS_STORE,
  STEPS_STORE,
  TIMELINES_STORE,
} from "./indexedDB";

const timelines_template: Timeline[] = [
  {
    id: "001",
    summary: "2026 Wild West's Annual Square Dance @ Hoe Down Market",
    date: new Date("2026-06-06"),
    date_modified: new Date("2026-06-06"),
    date_created: new Date("2026-06-06"),
    date_civil: "2026-06-06",
    timezone: "America/Chicago",
    start: 0,
    end: 0,
    rev: 1,
  },
  {
    id: "002",
    summary: "2026 Gery's Birthday @ 2 Cool Spa",
    date: new Date("2026-07-03"),
    date_modified: new Date("2026-07-03"),
    date_created: new Date("2026-07-03"),
    date_civil: "2026-07-03",
    timezone: "America/Chicago",
    start: 0,
    end: 0,
    rev: 1,
  },
  {
    id: "003",
    summary: "2026 Sara & Kim's Wedding @ Boutique Galla",
    date: new Date("2026-03-01"),
    date_modified: new Date("2026-03-01"),
    date_created: new Date("2026-03-01"),
    date_civil: "2026-03-01",
    timezone: "America/Chicago",
    start: 0,
    end: 0,
    rev: 1,
  },
];

const moments_template: TimelineMoment[] = [
  {
    id: 1,
    start: 960,
    end: 990,
    desc: "Pre-Seating Music",
    skill_id: 3,
    group_id: 1,
    timeline_uuid: "001",
    note: "",
  },
  {
    id: 2,
    start: 990,
    end: 1005,
    desc: "Presession of Ceremony",
    skill_id: 2,
    group_id: 1,
    timeline_uuid: "001",
    note: "",
  },
  {
    id: 3,
    start: 1005,
    end: 1020,
    desc: "Recession of Ceremony",
    skill_id: 2,
    group_id: 1,
    timeline_uuid: "001",
    note: "",
  },
  {
    id: 4,
    start: 1050,
    end: 1110,
    desc: "Cocktail Hour",
    skill_id: 3,
    group_id: 2,
    timeline_uuid: "001",
    note: "",
  },
  {
    id: 5,
    start: 1110,
    end: 1125,
    desc: "Introductions",
    skill_id: 1,
    group_id: 3,
    timeline_uuid: "001",
    note: "",
  },
  {
    id: 6,
    start: 1120,
    end: 1125,
    desc: "Cake Cutting",
    skill_id: 2,
    group_id: 4,
    timeline_uuid: "001",
    note: "",
  },
  {
    id: 7,
    start: 1125,
    end: 1140,
    desc: "Blessing",
    skill_id: 1,
    group_id: 5,
    timeline_uuid: "001",
    note: "",
  },
  {
    id: 8,
    start: 1125,
    end: 1200,
    desc: "Dinner Music",
    skill_id: 3,
    group_id: 2,
    timeline_uuid: "001",
    note: "",
  },
  {
    id: 9,
    start: 1170,
    end: 1185,
    desc: "Toasts",
    skill_id: 1,
    group_id: 4,
    timeline_uuid: "001",
    note: "",
  },
  {
    id: 10,
    start: 1200,
    end: 1215,
    desc: "Traditional Dances",
    skill_id: 2,
    group_id: 4,
    timeline_uuid: "001",
    note: "",
  },
  {
    id: 11,
    start: 1260,
    end: 1275,
    desc: "Bouquet and Garter Toss",
    skill_id: 2,
    group_id: 4,
    timeline_uuid: "001",
    note: "",
  },
  {
    id: 12,
    start: 1215,
    end: 1380,
    desc: "Open Dancefloor",
    skill_id: 3,
    group_id: 3,
    timeline_uuid: "001",
    note: "",
  },
];

const steps_template: MomentStep[] = [
  {
    id: 101,
    moment_id: 10,
    tbd: false,
    note: "",
    text: "Jerry & Kim (Father & Daughter)",
    order: 0,
  },
  {
    id: 102,
    moment_id: 10,
    tbd: false,
    note: "",
    text: "Hannah & Kevin (Mother & Son)",
    order: 0,
  },
  {
    id: 103,
    moment_id: 10,
    tbd: false,
    note: "",
    text: "Kim & Kevin (First Dance)",
    order: 0,
  },
  {
    id: 104,
    moment_id: 10,
    tbd: false,
    note: "",
    text: "",
    order: 0,
  },
  {
    id: 105,
    moment_id: 10,
    tbd: false,
    note: "",
    text: "",
    order: 0,
  },
  {
    id: 91,
    moment_id: 9,
    tbd: false,
    note: "",
    text: "Jerry (FOB)",
    order: 0,
  },
  {
    id: 92,
    moment_id: 9,
    tbd: false,
    note: "",
    text: "Sara (Matron of Honor)",
    order: 0,
  },
  {
    id: 93,
    moment_id: 9,
    tbd: false,
    note: "",
    text: "Brendan (Best Man)",
    order: 0,
  },
  {
    id: 94,
    moment_id: 9,
    tbd: false,
    note: "",
    text: "",
    order: 0,
  },
  {
    id: 51,
    order: 1,
    moment_id: 5,
    tbd: false,
    note: "",
    text: "Brendan & Sara",
  },
  {
    id: 52,
    order: 2,
    moment_id: 5,
    tbd: false,
    note: "",
    text: "Rachele & Harry",
  },
  {
    id: 53,
    order: 3,
    moment_id: 5,
    tbd: true,
    note: "",
    text: "TBD Tom (or Brett) & Jessica",
  },
];

const groups_template: TimelineGroup[] = [
  {
    id: 1,
    name: "Ceremony",
    timeline_uuid: "001",
  },
  {
    id: 2,
    name: "Reception",
    timeline_uuid: "001",
  },
  {
    id: 3,
    name: "Introductions",
    timeline_uuid: "001",
  },
  {
    id: 4,
    name: "Traditionals",
    timeline_uuid: "001",
  },
  {
    id: 5,
    name: "Dancing",
    timeline_uuid: "001",
  },
];

const skills_template: TimelineSkill[] = [
  {
    name: "MC Announcement",
    icon: "🎤",
    color: "hotpink",
    id: 1,
    timeline_uuid: "001",
  },
  {
    name: "Song Cue",
    icon: "♪",
    color: "limegreen",
    id: 2,
    timeline_uuid: "001",
  },
  {
    name: "Music Playlist",
    icon: "🎶",
    color: "cornflowerblue",
    id: 3,
    timeline_uuid: "001",
  },
  { name: "Misc", icon: "⎑", color: "", id: 4, timeline_uuid: "001" },
];

export async function seedIfEmpty() {
  const db = await openDB();

  const tx = db.transaction(
    [MOMENTS_STORE, GROUPS_STORE, SKILLS_STORE, STEPS_STORE, TIMELINES_STORE],
    "readwrite",
  );

  const timelinesStore = tx.objectStore(TIMELINES_STORE);
  const momentsStore = tx.objectStore(MOMENTS_STORE);
  const groupsStore = tx.objectStore(GROUPS_STORE);
  const skillsStore = tx.objectStore(SKILLS_STORE);
  const stepsStore = tx.objectStore(STEPS_STORE);

  function countStore(store: IDBObjectStore): Promise<number> {
    return new Promise((resolve, reject) => {
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  const [momentsCount, groupsCount, skillsCount, stepsCount, timelinesCount] =
    await Promise.all([
      countStore(momentsStore),
      countStore(groupsStore),
      countStore(skillsStore),
      countStore(stepsStore),
      countStore(timelinesStore),
    ]);

  if (timelinesCount === 0) {
    console.log("Seeding timelines...");
    timelines_template.forEach((b) => timelinesStore.add(b));
  }
  if (momentsCount === 0) {
    console.log("Seeding moments...");
    moments_template.forEach((b) => momentsStore.add(b));
  }

  if (groupsCount === 0) {
    console.log("Seeding groups...");
    groups_template.forEach((g) => groupsStore.add(g));
  }

  if (skillsCount === 0) {
    console.log("Seeding skills...");
    skills_template.forEach((s) => skillsStore.add(s));
  }

  if (stepsCount === 0) {
    console.log("Seeding todos...");
    steps_template.forEach((t) => stepsStore.add(t));
  }

  // Wait for the whole transaction to finish
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      resolve(true);
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
