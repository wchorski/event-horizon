export interface DriveCrumb {
  id: string | null; // null = root
  name: string;
  webUrl?: string;
}

export const ROOT_CRUMB: DriveCrumb = { id: null, name: "Documents" };

/**
 * Builds a same-page link that carries the breadcrumb trail as a query param.
 * The last crumb in the trail is the folder being navigated to.
 */
export function buildDriveHref(basePath: string, crumbs: DriveCrumb[]): string {
  const last = crumbs[crumbs.length - 1];
  const params = new URLSearchParams();

  if (last?.id) {
    params.set("itemId", last.id);
  }
  params.set("crumbs", JSON.stringify(crumbs));

  return `${basePath}?${params.toString()}`;
}

/**
 * Parses the crumbs query param back into a breadcrumb trail.
 * Falls back to just the root crumb if missing or malformed.
 */
export function parseDriveCrumbs(param: string | null): DriveCrumb[] {
  if (!param) return [ROOT_CRUMB];

  try {
    const parsed = JSON.parse(param);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.name) {
      return parsed as DriveCrumb[];
    }
  } catch {
    // fall through to default
  }

  return [ROOT_CRUMB];
}
