import { isIdField, isTimeField } from "@lib/regex";
import { formatTimeToMinutes } from "@lib/timeFormatters";
import type {
  BlockPlanner,
  BlockPlannerInput,
  GroupPlanner,
  SkillPlanner,
} from "@ty/Schema";

const DB_NAME = "planner-db";
//? any changes to the 'schema' need to up the version number
const DB_VERSION = 2;

const BLOCKS_STORE = "blocks";
const GROUPS_STORE = "groups";
const SKILLS_STORE = "skills";

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      resolve(request.result);
    };

    // if version number is newer, run this
    request.onupgradeneeded = (event) => {
      const db = request.result;

      if (!db.objectStoreNames.contains(BLOCKS_STORE)) {
        const store = db.createObjectStore(BLOCKS_STORE, {
          keyPath: "id",
        });

        // useful later
        store.createIndex("group_id", "group_id", { unique: false });
        store.createIndex("skill_id", "skill_id", { unique: false });
      }

      if (!db.objectStoreNames.contains(GROUPS_STORE)) {
        db.createObjectStore(GROUPS_STORE, {
          keyPath: "id",
        });
      }

      if (!db.objectStoreNames.contains(SKILLS_STORE)) {
        db.createObjectStore(SKILLS_STORE, {
          keyPath: "id",
        });
      }
    };
  });
}

//* BLOCKS
export async function getAllBlockPlans(): Promise<BlockPlanner[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOCKS_STORE, "readonly");
    const store = tx.objectStore(BLOCKS_STORE);

    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function dbCreateBlockPlan(
  block: Omit<BlockPlanner, "id">,
): Promise<BlockPlanner> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOCKS_STORE, "readwrite");
    const store = tx.objectStore(BLOCKS_STORE);
    const req = store.add(block);

    req.onsuccess = () => {
      resolve({ ...block, id: req.result as number });
    };
    req.onerror = () => reject(req.error);
  });
}
export async function idbUpdateTimeBlock(
  id: number,
  updates: Partial<BlockPlannerInput>,
) {
  const coerced = Object.fromEntries(
    Object.entries(updates).map(([key, value]) => [
      key,
      isIdField(key) && value !== ""
        ? Number(value)
        : isTimeField(key) && typeof value === "string"
          ? formatTimeToMinutes(value)
          : value,
    ]),
  ) as Partial<BlockPlanner>;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOCKS_STORE, "readwrite");
    const store = tx.objectStore(BLOCKS_STORE);
    const req = store.get(id);

    req.onsuccess = () => {
      const existing = req.result;
      if (!existing) return reject(new Error(`Block ${id} not found`));

      const merged = { ...existing, ...coerced };
      const putReq = store.put(merged);
      console.log(merged);

      putReq.onsuccess = () =>
        resolve({ ...merged, id: putReq.result as number });
      putReq.onerror = () => reject(putReq.error);
    };

    req.onerror = () => reject(req.error);
  });
}
export async function deleteBlockPlan(id: number) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOCKS_STORE, "readwrite");
    const store = tx.objectStore(BLOCKS_STORE);
    const req = store.delete(id);

    req.onsuccess = () => {
      console.log("block deleted with ID: ", id);
    };

    req.onerror = (event) => {
      // @ts-ignore
      console.error("Error deleting Block:", event?.target?.errorCode);
      reject(req.error);
    };
  });
}

//* GROUPS
export async function getAllGroupPlans(): Promise<GroupPlanner[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(GROUPS_STORE, "readonly");
    const store = tx.objectStore(GROUPS_STORE);

    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function getAllSkillPlans(): Promise<SkillPlanner[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SKILLS_STORE, "readonly");
    const store = tx.objectStore(SKILLS_STORE);

    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
