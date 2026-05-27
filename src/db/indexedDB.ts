const DB_NAME = "planner-db";
const DB_VERSION = 1;

const BLOCKS_STORE = "blocks";
const GROUPS_STORE = "groups";

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;

      // ✅ create blocks store
      if (!db.objectStoreNames.contains(BLOCKS_STORE)) {
        const store = db.createObjectStore(BLOCKS_STORE, {
          keyPath: "id",
        });

        // useful later
        store.createIndex("group_id", "group_id", { unique: false });
        store.createIndex("skill_id", "skill_id", { unique: false });
      }

      // ✅ create groups store
      if (!db.objectStoreNames.contains(GROUPS_STORE)) {
        db.createObjectStore(GROUPS_STORE, {
          keyPath: "id",
        });
      }
    };
  });
}

export async function getAllBlockPlans() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("blocks", "readonly");
    const store = tx.objectStore("blocks");

    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function getAllGroupPlans() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("groups", "readonly");
    const store = tx.objectStore("groups");

    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
