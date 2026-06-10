import { isCheckboxField, isIdField, isTimeField } from "@lib/regex";
import { formatTimeToMinutes } from "@lib/timeFormatters";
import type {
  TimelineMoment,
  TimelineMomentInput,
  TimelineGroup,
  TimelineSkill,
  MomentStep,
} from "@ty/Schema";

const DB_NAME = "timeline-db";
//? any changes to the 'schema' need to up the version number
const DB_VERSION = 6;

export const MOMENTS_STORE = "moments";
export const GROUPS_STORE = "groups";
export const SKILLS_STORE = "skills";
export const STEPS_STORE = "steps";

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

      if (!db.objectStoreNames.contains(MOMENTS_STORE)) {
        const store = db.createObjectStore(MOMENTS_STORE, {
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
      if (!db.objectStoreNames.contains(STEPS_STORE)) {
        db.createObjectStore(STEPS_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };
  });
}

//* MOMENTS
export async function idbGetAllMoments(): Promise<TimelineMoment[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(MOMENTS_STORE, "readonly");
    const store = tx.objectStore(MOMENTS_STORE);

    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function idbCreateMoment(
  moment: Omit<TimelineMoment, "id">,
): Promise<TimelineMoment> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MOMENTS_STORE, "readwrite");
    const store = tx.objectStore(MOMENTS_STORE);
    const req = store.add(moment);

    req.onsuccess = () => {
      resolve({ ...moment, id: req.result as number });
    };
    req.onerror = () => reject(req.error);
  });
}
export async function idbUpdateMoment(
  id: number,
  updates: Partial<TimelineMomentInput>,
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
  ) as Partial<TimelineMoment>;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MOMENTS_STORE, "readwrite");
    const store = tx.objectStore(MOMENTS_STORE);
    const req = store.get(id);

    req.onsuccess = () => {
      const existing = req.result;
      if (!existing) return reject(new Error(`Block ${id} not found`));

      const merged = { ...existing, ...coerced };
      const putReq = store.put(merged);

      putReq.onsuccess = () =>
        resolve({ ...merged, id: putReq.result as number });
      putReq.onerror = () => reject(putReq.error);
    };

    req.onerror = () => reject(req.error);
  });
}
export async function idbDeleteMoment(id: number) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(MOMENTS_STORE, "readwrite");
    const store = tx.objectStore(MOMENTS_STORE);
    const req = store.delete(id);

    req.onsuccess = () => {
      console.log("moment deleted with ID: ", id);
      resolve(true);
    };

    req.onerror = (event) => {
      // @ts-ignore
      console.error("Error deleting moment:", event?.target?.errorCode);
      reject(req.error);
    };
  });
}

//* STEP
export async function idbGetAllSteps(): Promise<MomentStep[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STEPS_STORE, "readonly");
    const store = tx.objectStore(STEPS_STORE);

    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function idbCreateStep(
  skill: Omit<MomentStep, "id">,
): Promise<MomentStep> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STEPS_STORE, "readwrite");
    const store = tx.objectStore(STEPS_STORE);
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
export async function idbUpdateStep(
  id: number,
  updates: Partial<MomentStep>,
) {
  const coerced = Object.fromEntries(
    Object.entries(updates).map(([key, value]) => [
        key,
        isIdField(key) && value !== ""
            ? Number(value)
            : isTimeField(key) && typeof value === "string"
            ? formatTimeToMinutes(value)
            : isCheckboxField(key) && typeof value === "string"
            ? value === "true" || value === "on"
            : value,
    ]),
) as Partial<MomentStep>;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STEPS_STORE, "readwrite");
    const store = tx.objectStore(STEPS_STORE);
    const req = store.get(id);

    req.onsuccess = () => {
      const existing = req.result;
      if (!existing) return reject(new Error(`step.id ${id} not found`));

      const merged = { ...existing, ...coerced };
      console.log({merged});
      const putReq = store.put(merged);

      putReq.onsuccess = () =>
        resolve({ ...merged, id: putReq.result as number });
      putReq.onerror = () => reject(putReq.error);
    };

    req.onerror = () => reject(req.error);
  });
}
export async function idbDeleteStep(id: number) {
  const db = await openDB();

  return new Promise<any>((resolve, reject) => {
    const tx = db.transaction(STEPS_STORE, "readwrite");
    const store = tx.objectStore(STEPS_STORE);

    const getReq = store.get(id);

    getReq.onerror = () => {
      reject(getReq.error);
    };

    getReq.onsuccess = () => {
      const existing = getReq.result;

      if (!existing) {
        reject(new Error(`No ${STEPS_STORE} found for id ${id}`));
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

//* GROUPS
export async function idbGetAllGroupPlans(): Promise<TimelineGroup[]> {
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
  group: Omit<TimelineGroup, "id">,
): Promise<TimelineGroup> {
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
  updates: Partial<TimelineGroup>,
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
  ) as Partial<TimelineGroup>;
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
export async function idbGetAllSkill(): Promise<TimelineSkill[]> {
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
  skill: Omit<TimelineSkill, "id">,
): Promise<TimelineSkill> {
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
  updates: Partial<TimelineSkill>,
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
  ) as Partial<TimelineSkill>;
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
