import type {
  BlockPlanner,
  GroupPlanner,
} from "../pages/planners/[id]/index.astro";
import { openDB } from "./indexedDB";

const BLOCKS_STORE = "blocks";
const GROUPS_STORE = "groups";

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
    end: 1050,
    desc: "Ceremony",
    skill_id: 2,
    group_id: 1,
    note: "",
  },
  {
    id: 3,
    start: 1050,
    end: 1110,
    desc: "Cocktail Hour",
    skill_id: 3,
    group_id: 2,
    note: "",
  },
  {
    id: 4,
    start: 1110,
    end: 1125,
    desc: "Introductions",
    skill_id: 1,
    group_id: 3,
    note: "",
  },
  {
    id: 5,
    start: 1120,
    end: 1125,
    desc: "Cake Cutting",
    skill_id: 2,
    group_id: 4,
    note: "",
  },
  {
    id: 6,
    start: 1125,
    end: 1140,
    desc: "Blessing",
    skill_id: 1,
    group_id: 5,
    note: "",
  },
  {
    id: 7,
    start: 1125,
    end: 1200,
    desc: "Dinner Music",
    skill_id: 3,
    group_id: 2,
    note: "",
  },
  {
    id: 8,
    start: 1170,
    end: 1185,
    desc: "Toasts",
    skill_id: 1,
    group_id: 4,
    note: "",
  },
  {
    id: 9,
    start: 1200,
    end: 1215,
    desc: "Traditional Dances",
    skill_id: 2,
    group_id: 4,
    note: "",
  },
  {
    id: 10,
    start: 1260,
    end: 1275,
    desc: "Bouquet and Garter Toss",
    skill_id: 2,
    group_id: 3,
    note: "",
  },
  {
    id: 11,
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

export async function seedIfEmpty() {
  const db = await openDB();

  const tx = db.transaction([BLOCKS_STORE, GROUPS_STORE], "readwrite");

  const blocksStore = tx.objectStore(BLOCKS_STORE);
  const groupsStore = tx.objectStore(GROUPS_STORE);

  // ✅ check if blocks already exist
  const countRequest = blocksStore.count();

  return new Promise((resolve, reject) => {
    countRequest.onerror = () => reject(countRequest.error);

    countRequest.onsuccess = () => {
      const count = countRequest.result;

      if (count === 0) {
        console.log("✅ First visit → seeding IndexedDB");

        // ✅ insert blocks
        blocks_template.forEach((b) => {
          blocksStore.add(b);
        });

        // ✅ insert groups
        groups_template.forEach((g) => {
          groupsStore.add(g);
        });
      }

      tx.oncomplete = () => {
        console.log('initPlannerDB tx.oncomplete');
        resolve(true)
    };
      tx.onerror = () => reject(tx.error);
    };
  });
}
``;
