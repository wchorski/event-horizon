import type { BlockPlanner, GroupPlanner, TodoPlanner } from "@ty/Schema";
import { openDB } from "./indexedDB";

const BLOCKS_STORE = "blocks";
const GROUPS_STORE = "groups";
const SKILLS_STORE = "skills";

const todos_template: TodoPlanner[] = [
  {
    id: 1,
    order: 1,
    block_id: 5,
    tbd: false,
    note: "",
    text: "Brendan & Sara",
  },
  {
    id: 2,
    order: 2,
    block_id: 5,
    tbd: false,
    note: "",
    text: "Rachele & Harry",
  },
  {
    id: 3,
    order: 3,
    block_id: 5,
    tbd: true,
    note: "",
    text: "TBD Tom (or Brett) & Jessica",
  },
];

const blocks_template: BlockPlanner[] = [
  {
    id: 1,
    start: 960,
    end: 990,
    desc: "Pre-Seating Music",
    skill_id: 3,
    group_id: 1,
    note: "",
  },
  {
    id: 2,
    start: 990,
    end: 1005,
    desc: "Presession of Ceremony",
    skill_id: 2,
    group_id: 1,
    note: "",
  },
  {
    id: 3,
    start: 1005,
    end: 1020,
    desc: "Recession of Ceremony",
    skill_id: 2,
    group_id: 1,
    note: "",
  },
  {
    id: 4,
    start: 1050,
    end: 1110,
    desc: "Cocktail Hour",
    skill_id: 3,
    group_id: 2,
    note: "",
  },
  {
    id: 5,
    start: 1110,
    end: 1125,
    desc: "Introductions",
    skill_id: 1,
    group_id: 3,
    note: "",
  },
  {
    id: 6,
    start: 1120,
    end: 1125,
    desc: "Cake Cutting",
    skill_id: 2,
    group_id: 4,
    note: "",
  },
  {
    id: 7,
    start: 1125,
    end: 1140,
    desc: "Blessing",
    skill_id: 1,
    group_id: 5,
    note: "",
  },
  {
    id: 8,
    start: 1125,
    end: 1200,
    desc: "Dinner Music",
    skill_id: 3,
    group_id: 2,
    note: "",
  },
  {
    id: 9,
    start: 1170,
    end: 1185,
    desc: "Toasts",
    skill_id: 1,
    group_id: 4,
    note: "",
  },
  {
    id: 10,
    start: 1200,
    end: 1215,
    desc: "Traditional Dances",
    skill_id: 2,
    group_id: 4,
    note: "",
  },
  {
    id: 11,
    start: 1260,
    end: 1275,
    desc: "Bouquet and Garter Toss",
    skill_id: 2,
    group_id: 4,
    note: "",
  },
  {
    id: 12,
    start: 1215,
    end: 1380,
    desc: "Open Dancefloor",
    skill_id: 3,
    group_id: 3,
    note: "",
  },
];

const groups_template: GroupPlanner[] = [
  {
    id: 1,
    name: "Ceremony",
  },
  {
    id: 2,
    name: "Reception",
  },
  {
    id: 3,
    name: "Introductions",
  },
  {
    id: 4,
    name: "Traditionals",
  },
  {
    id: 5,
    name: "Dancing",
  },
];

const skills_template = [
  { name: "MC Announcement", id: 1 },
  { name: "Song Cue", id: 2 },
  { name: "Music Playlist", id: 3 },
  { name: "Misc", id: 4 },
];

export async function seedIfEmpty() {
  const db = await openDB();

  const tx = db.transaction(
    [BLOCKS_STORE, GROUPS_STORE, SKILLS_STORE],
    "readwrite",
  );

  const blocksStore = tx.objectStore(BLOCKS_STORE);
  const groupsStore = tx.objectStore(GROUPS_STORE);
  const skillsStore = tx.objectStore(SKILLS_STORE);

  function countStore(store: IDBObjectStore): Promise<number> {
    return new Promise((resolve, reject) => {
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  const [blocksCount, groupsCount, skillsCount] = await Promise.all([
    countStore(blocksStore),
    countStore(groupsStore),
    countStore(skillsStore),
  ]);

  if (blocksCount === 0) {
    console.log("Seeding blocks...");
    blocks_template.forEach((b) => blocksStore.add(b));
  }

  if (groupsCount === 0) {
    console.log("Seeding groups...");
    groups_template.forEach((g) => groupsStore.add(g));
  }

  if (skillsCount === 0) {
    console.log("Seeding skills...");
    skills_template.forEach((s) => skillsStore.add(s));
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
