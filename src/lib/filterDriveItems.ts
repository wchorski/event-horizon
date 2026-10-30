import type { DriveItem } from "@microsoft/microsoft-graph-types";
import type { SessionTeam } from "../env";

const WORKING_DIRS = ["PREPERATIONS", "PUBLISHED"]; // check spelling against the actual folder names

export function getPathParts(path:string|undefined): string[] {
  // const path = items[0]?.parentReference?.path ?? "";
  if(!path) return []
  const afterRoot = path.split("root:")[1] ?? "";
  const rootPath = afterRoot.replace(/^\/+/, "");
  return rootPath ? rootPath.split("/") : [];
}

export function filterDriveItemsByTeam(
  teams: SessionTeam[] | null,
  items: DriveItem[],
): DriveItem[] {
  if (!teams) return [];

  const parts = getPathParts(items[0]?.parentReference?.path ?? "");
  const parentName = parts.at(-1);

  // Only the department level (children of PUBLISHED / PREPERATIONS) is restricted
  const isDepartmentLevel = !!parentName && WORKING_DIRS.includes(parentName);
  if (!isDepartmentLevel) return items;

  const teamNames = new Set(teams.map((t) => t.name));
  return items.filter((it) => teamNames.has(it.name));
}