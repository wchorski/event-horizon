import { isIdField, isTimeField } from "@lib/regex";
import { formatTimeToMinutes } from "@lib/timeFormatters";
import type {
  BlockPlanner,
  BlockPlannerInput,
  GroupPlanner,
  SkillPlanner,
  TodoPlanner,
} from "@ty/Schema";

const DB_NAME = "timeline-db";
//? any changes to the 'schema' need to up the version number
const DB_VERSION = 4;

export const BLOCKS_STORE = "blocks";
export const GROUPS_STORE = "groups";
export const SKILLS_STORE = "skills";
export const TODOS_STORE = "todos";

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
          autoIncrement: true,
        });

        // useful later
        store.createIndex("group_id", "group_id", { unique: false });
        store.createIndex("skill_id", "skill_id", { unique: false });
      }

      if (!db.objectStoreNames.contains(GROUPS_STORE)) {
        db.createObjectStore(GROUPS_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
      }

      if (!db.objectStoreNames.contains(SKILLS_STORE)) {
        db.createObjectStore(SKILLS_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains(TODOS_STORE)) {
        db.createObjectStore(TODOS_STORE, {
          keyPath: "id",
          autoIncrement: true,
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
export async function idbDeleteBlockPlan(id: number) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOCKS_STORE, "readwrite");
    const store = tx.objectStore(BLOCKS_STORE);
    const req = store.delete(id);

    req.onsuccess = () => {
      console.log("block deleted with ID: ", id);
      resolve(true);
    };

    req.onerror = (event) => {
      // @ts-ignore
      console.error("Error deleting Block:", event?.target?.errorCode);
      reject(req.error);
    };
  });
}

//* TODOS
export async function getAllTimelineTodos(): Promise<TodoPlanner[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(TODOS_STORE, "readonly");
    const store = tx.objectStore(TODOS_STORE);

    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function idbUpdateTimelineTodo(
  id: number,
  updates: Partial<TodoPlanner>,
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
  ) as Partial<TodoPlanner>;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TODOS_STORE, "readwrite");
    const store = tx.objectStore(TODOS_STORE);
    const req = store.get(id);

    req.onsuccess = () => {
      const existing = req.result;
      if (!existing) return reject(new Error(`Todo ${id} not found`));

      const merged = { ...existing, ...coerced };
      const putReq = store.put(merged);

      putReq.onsuccess = () =>
        resolve({ ...merged, id: putReq.result as number });
      putReq.onerror = () => reject(putReq.error);
    };

    req.onerror = () => reject(req.error);
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
export async function idbCreateTimelineGroup(
  group: Omit<GroupPlanner, "id">,
): Promise<GroupPlanner> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GROUPS_STORE, "readwrite");
    const store = tx.objectStore(GROUPS_STORE);
    const req = store.add(group);

    req.onsuccess = () => {
      resolve({ ...group, id: req.result as number });
    };
    req.onerror = () => {
      console.error("IDB error:", req.error?.name, req.error?.message);
      reject(req.error);
    };
  });
}
export async function idbUpdateTimeGroup(
  id: number,
  updates: Partial<GroupPlanner>,
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
  ) as Partial<GroupPlanner>;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GROUPS_STORE, "readwrite");
    const store = tx.objectStore(GROUPS_STORE);
    const req = store.get(id);

    req.onsuccess = () => {
      const existing = req.result;
      if (!existing) return reject(new Error(`Group ${id} not found`));

      const merged = { ...existing, ...coerced };
      const putReq = store.put(merged);

      putReq.onsuccess = () =>
        resolve({ ...merged, id: putReq.result as number });
      putReq.onerror = () => reject(putReq.error);
    };

    req.onerror = () => reject(req.error);
  });
}
export async function idbDeleteTimeGroup(id: number) {
  const db = await openDB();

  return new Promise<any>((resolve, reject) => {
    const tx = db.transaction(GROUPS_STORE, "readwrite");
    const store = tx.objectStore(GROUPS_STORE);

    const getReq = store.get(id);

    getReq.onerror = () => {
      reject(getReq.error);
    };

    getReq.onsuccess = () => {
      const existing = getReq.result;

      if (!existing) {
        reject(new Error(`No group found for id ${id}`));
        return;
      }

      const deleteReq = store.delete(id);

      deleteReq.onerror = () => {
        reject(deleteReq.error);
      };

      tx.oncomplete = () => {
        resolve(existing);
      };

      tx.onerror = () => {
        reject(tx.error);
      };

      tx.onabort = () => {
        reject(tx.error);
      };
    };
  });
}

//* SKILLS
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
export async function idbCreateTimelineSkill(
  skill: Omit<SkillPlanner, "id">,
): Promise<SkillPlanner> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SKILLS_STORE, "readwrite");
    const store = tx.objectStore(SKILLS_STORE);
    const req = store.add(skill);

    req.onsuccess = () => {
      resolve({ ...skill, id: req.result as number });
    };
    req.onerror = () => {
      console.error("IDB error:", req.error?.name, req.error?.message);
      reject(req.error);
    };
  });
}
export async function idbUpdateTimeSkill(
  id: number,
  updates: Partial<SkillPlanner>,
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
  ) as Partial<SkillPlanner>;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SKILLS_STORE, "readwrite");
    const store = tx.objectStore(SKILLS_STORE);
    const req = store.get(id);

    req.onsuccess = () => {
      const existing = req.result;
      if (!existing) return reject(new Error(`Skill ${id} not found`));

      const merged = { ...existing, ...coerced };
      const putReq = store.put(merged);

      putReq.onsuccess = () =>
        resolve({ ...merged, id: putReq.result as number });
      putReq.onerror = () => reject(putReq.error);
    };

    req.onerror = () => reject(req.error);
  });
}
export async function idbDeleteTimeSkill(id: number) {
  const db = await openDB();

  return new Promise<any>((resolve, reject) => {
    const tx = db.transaction(SKILLS_STORE, "readwrite");
    const store = tx.objectStore(SKILLS_STORE);

    const getReq = store.get(id);

    getReq.onerror = () => {
      reject(getReq.error);
    };

    getReq.onsuccess = () => {
      const existing = getReq.result;

      if (!existing) {
        reject(new Error(`No skill found for id ${id}`));
        return;
      }

      const deleteReq = store.delete(id);

      deleteReq.onerror = () => {
        reject(deleteReq.error);
      };

      tx.oncomplete = () => {
        resolve(existing);
      };

      tx.onerror = () => {
        reject(tx.error);
      };

      tx.onabort = () => {
        reject(tx.error);
      };
    };
  });
}
