// src/lib/formParsing.ts
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
    setPath(result, tokenize(key), value);
  }
  return result;
}