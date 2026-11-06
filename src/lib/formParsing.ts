// src/lib/formParsing.ts
const BLOCKED = new Set(["__proto__", "constructor", "prototype"]);
//? Another approach is to build the result with Object.create(null), which creates objects with no parent at all.

function tokenize(key: string): string[] {
  // "attendees[0].emailAddress.address" -> ["attendees", "0", "emailAddress", "address"]
  return key.replace(/\[(\d+)\]/g, ".$1").split(".");
}

function setPath(target: Record<string, any>, path: string[], value: unknown) {
  let node = target;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const nextKeyIsIndex = /^\d+$/.test(path[i + 1]);
    if (node[key] === undefined) node[key] = nextKeyIsIndex ? [] : {};
    node = node[key];
  }
  node[path[path.length - 1]] = value;
}

export function unflatten(formData: FormData): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("_")) continue;
    const path = tokenize(key);
    if (path.some((p) => BLOCKED.has(p))) continue;
    setPath(result, path, value);
  }
  return result;
}