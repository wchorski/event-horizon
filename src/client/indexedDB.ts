import { isCheckboxField, isIdField, isTimeField } from "@lib/regex";
import { formatTimeToMinutes } from "@lib/timeFormatters";
import type {
  TimelineMoment,
  TimelineMomentInput,
  TimelineGroup,
  TimelineSkill,
  MomentStep,
  Timeline,
  TimelineState,
  InsertableTimelineGraph,
} from "@ty/Schema";
import { uuidv7 } from "./uuidv7";
import type { buildFromTemplate } from "./templates/timelineTemplates";

const DB_NAME = "timeline-db";
//? any changes to the 'schema' need to up the version number
const DB_VERSION = 9;

export const MOMENTS_STORE = "moments";
export const TIMELINES_STORE = "timelines";
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

      if (!db.objectStoreNames.contains(TIMELINES_STORE)) {
        db.createObjectStore(TIMELINES_STORE, {
          keyPath: "id",
          // autoIncrement: true,
        });
      }

      if (!db.objectStoreNames.contains(MOMENTS_STORE)) {
        const store = db.createObjectStore(MOMENTS_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });

        // useful later
        store.createIndex("group_id", "group_id", { unique: false });
        store.createIndex("skill_id", "skill_id", { unique: false });
        store.createIndex("timeline_uuid", "timeline_uuid", { unique: false });
      }

      if (!db.objectStoreNames.contains(GROUPS_STORE)) {
        const store = db.createObjectStore(GROUPS_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });

        store.createIndex("timeline_uuid", "timeline_uuid", { unique: false });
      }

      if (!db.objectStoreNames.contains(SKILLS_STORE)) {
        const store = db.createObjectStore(SKILLS_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("timeline_uuid", "timeline_uuid", { unique: false });
      }
      if (!db.objectStoreNames.contains(STEPS_STORE)) {
        const store = db.createObjectStore(STEPS_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("moment_id", "moment_id", { unique: false });
      }
    };
  });
}

// * TIMELINES
export async function idbGetAllTimelines(): Promise<Timeline[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(TIMELINES_STORE, "readonly");
    const store = tx.objectStore(TIMELINES_STORE);

    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function idbGetSingleTimelineData(timeline_uuid: string): Promise<
  Timeline & {
    moments: TimelineMoment[];
    steps: MomentStep[];
    groups: TimelineGroup[];
    skills: TimelineSkill[];
  }
> {
  const db = await openDB();

  // Run both queries in parallel — they share a multi-store transaction
  const [timeline, moments, groups, skills] = await Promise.all([
    new Promise<Timeline>((resolve, reject) => {
      const tx = db.transaction(TIMELINES_STORE, "readonly");
      const request = tx.objectStore(TIMELINES_STORE).get(timeline_uuid);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }),
    new Promise<TimelineMoment[]>((resolve, reject) => {
      const tx = db.transaction(MOMENTS_STORE, "readonly");
      const index = tx.objectStore(MOMENTS_STORE).index("timeline_uuid");
      const request = index.getAll(timeline_uuid); // id === timeline_uuid
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }),
    new Promise<TimelineGroup[]>((resolve, reject) => {
      const tx = db.transaction(GROUPS_STORE, "readonly");
      const index = tx.objectStore(GROUPS_STORE).index("timeline_uuid");
      const request = index.getAll(timeline_uuid); // id === timeline_uuid
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }),
    new Promise<TimelineSkill[]>((resolve, reject) => {
      const tx = db.transaction(SKILLS_STORE, "readonly");
      const index = tx.objectStore(SKILLS_STORE).index("timeline_uuid");
      const request = index.getAll(timeline_uuid); // id === timeline_uuid
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }),
  ]);

  if (!timeline)
    throw new Error(
      `Timeline "${timeline_uuid}" not found. Import the JSON backup or start a new template`,
    );

  const momentIds = new Set(moments.map((m) => m.id));

  const steps = await new Promise<MomentStep[]>((resolve, reject) => {
    const tx = db.transaction(STEPS_STORE, "readonly");
    const index = tx.objectStore(STEPS_STORE).index("moment_id");

    const allSteps: MomentStep[] = [];
    // Query steps for each moment in parallel
    let remaining = momentIds.size;
    if (remaining === 0) return resolve([]);

    for (const momentId of momentIds) {
      const request = index.getAll(momentId);
      request.onsuccess = () => {
        allSteps.push(...request.result);
        if (--remaining === 0) resolve(allSteps);
      };
      request.onerror = () => reject(request.error);
    }
  });

  return { ...timeline, moments, steps, groups, skills };
}
export async function idbUpdateTimeline(
  uuid: string,
  updates: Partial<Timeline>,
  // isCommit: boolean,
): Promise<Timeline> {
  const coerced = Object.fromEntries(
    Object.entries(updates).map(([key, value]) => [
      key,
      isIdField(key) && value !== ""
        ? Number(value)
        : isTimeField(key) && typeof value === "string"
          ? formatTimeToMinutes(value)
          : value,
    ]),
  ) as Partial<Timeline>;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TIMELINES_STORE, "readwrite");
    const store = tx.objectStore(TIMELINES_STORE);
    const req = store.get(uuid);

    req.onsuccess = () => {
      const existing: Timeline = req.result;
      if (!existing) return reject(new Error(`Timeline ${uuid} not found`));

      const merged: Timeline = {
        ...existing,
        ...coerced,
        date_modified: new Date(),
        // TODO don't need if getting from db
        // ...(isCommit ? { rev: existing.rev + 1 } : {}),
      };

      const putReq = store.put(merged);

      putReq.onsuccess = () =>
        resolve({ ...merged, id: putReq.result as string });
      putReq.onerror = () => reject(putReq.error);
    };

    req.onerror = () => reject(req.error);
  });
}

function addAndGetKey<T>(store: IDBObjectStore, value: T): Promise<number> {
  return new Promise((resolve, reject) => {
    const req = store.add(value);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

function putValue<T>(store: IDBObjectStore, value: T): Promise<IDBValidKey> {
  return new Promise((resolve, reject) => {
    const req = store.put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbInsertTimelineGraph(graph: InsertableTimelineGraph) {
  const db = await openDB();

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      [TIMELINES_STORE, GROUPS_STORE, SKILLS_STORE, MOMENTS_STORE, STEPS_STORE],
      "readwrite",
    );

    const timelinesStore = tx.objectStore(TIMELINES_STORE);
    const groupsStore = tx.objectStore(GROUPS_STORE);
    const skillsStore = tx.objectStore(SKILLS_STORE);
    const momentsStore = tx.objectStore(MOMENTS_STORE);
    const stepsStore = tx.objectStore(STEPS_STORE);

    const { groups, skills, moments, steps, ...timelineBase } = graph;

    const groupIdMap = new Map<number, number>();
    const skillIdMap = new Map<number, number>();
    const momentIdMap = new Map<number, number>();

    // --- helper to wrap IDB requests ---
    const reqToPromise = <T = any>(req: IDBRequest<T>) =>
      new Promise<T>((res, rej) => {
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      });

    (async () => {
      try {
        // ✅ timeline (use put)
        await reqToPromise(
          timelinesStore.put({
            ...timelineBase,
            id: graph.id,
          }),
        );

        // ✅ groups
        for (const g of groups) {
          const { source_id, ...groupToInsert } = g;
          const newId = (await reqToPromise(
            groupsStore.add(groupToInsert),
          )) as number;

          groupIdMap.set(source_id, newId);
        }

        // ✅ skills
        for (const s of skills) {
          const { source_id, ...skillToInsert } = s;
          const newId = (await reqToPromise(
            skillsStore.add(skillToInsert),
          )) as number;

          skillIdMap.set(source_id, newId);
        }

        // ✅ moments
        for (const m of moments) {
          const {
            source_id,
            source_group_id,
            source_skill_id,
            ...momentToInsert
          } = m;

          const newGroupId = groupIdMap.get(source_group_id);
          const newSkillId = skillIdMap.get(source_skill_id);

          if (newGroupId == null) {
            throw new Error(
              `Missing group remap for source_group_id=${source_group_id}`,
            );
          }

          if (newSkillId == null) {
            throw new Error(
              `Missing skill remap for source_skill_id=${source_skill_id}`,
            );
          }

          const newId = (await reqToPromise(
            momentsStore.add({
              ...momentToInsert,
              group_id: newGroupId,
              skill_id: newSkillId,
            }),
          )) as number;

          momentIdMap.set(source_id, newId);
        }

        // ✅ steps
        for (const s of steps) {
          const { source_moment_id, ...stepToInsert } = s;

          const newMomentId = momentIdMap.get(source_moment_id);

          if (newMomentId == null) {
            throw new Error(
              `Missing moment remap for source_moment_id=${source_moment_id}`,
            );
          }

          await reqToPromise(
            stepsStore.add({
              ...stepToInsert,
              moment_id: newMomentId,
            }),
          );
        }
      } catch (err) {
        tx.abort();
        reject(err);
      }
    })();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// Helper: inserts a batch, returns a Map<oldId, newId>
async function insertWithIdRemap<T extends { id: number }>(
  items: T[],
  createFn: (item: Omit<T, "id">) => Promise<T>,
): Promise<Map<number, number>> {
  const idMap = new Map<number, number>();

  await Promise.all(
    items.map(async ({ id: oldId, ...rest }) => {
      const created = await createFn(rest as Omit<T, "id">);
      idMap.set(oldId, created.id);
    }),
  );

  return idMap;
}

//* MOMENTS
export async function idbGetAllMoments(
  timeline_uuid?: string,
): Promise<TimelineMoment[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(MOMENTS_STORE, "readonly");
    const store = tx.objectStore(MOMENTS_STORE);

    const request = store.getAll(timeline_uuid);

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
): Promise<TimelineMoment> {
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
      const existing: TimelineMoment = req.result;
      if (!existing) return reject(new Error(`Moment ${id} not found`));

      const merged: TimelineMoment = { ...existing, ...coerced };
      // TODO maybe move into it's own 'validate' func?
      if (merged.end <= merged.start) {
        merged.end = merged.start + 15;
      }
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
export async function idbUpdateStep(id: number, updates: Partial<MomentStep>) {
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
      const existing: MomentStep = req.result;
      if (!existing) return reject(new Error(`step.id ${id} not found`));

      const merged: MomentStep = { ...existing, ...coerced };
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
      const existing: MomentStep = getReq.result;

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
): Promise<TimelineGroup> {
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
      const existing: TimelineGroup = req.result;
      if (!existing) return reject(new Error(`Group ${id} not found`));

      const merged: TimelineGroup = { ...existing, ...coerced };
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
      const existing: TimelineGroup = getReq.result;

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
): Promise<TimelineSkill> {
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
      const existing: TimelineSkill = req.result;
      if (!existing) return reject(new Error(`Skill ${id} not found`));

      const merged: TimelineSkill = { ...existing, ...coerced };
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
      const existing: TimelineSkill = getReq.result;

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
