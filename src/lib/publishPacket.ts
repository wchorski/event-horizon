// Turns "/PREPERATIONS/MOEITS Board/2026/09-15" into "/PUBLISHED/MOEITS Board/2026/09-15"
export function getFullPath(item: { name: string; parentReference: { path: string } }): string {
  const marker = "root:";
  const idx = item.parentReference.path.indexOf(marker);
  const parentPath = idx >= 0 ? item.parentReference.path.slice(idx + marker.length) : "";
  return `${parentPath}/${item.name}`.replace(/^\/+/, "");
}

export function mirrorToPublished(sourcePath: string): string[] {
  const segments = sourcePath.split("/").filter(Boolean);
  if (segments[0]?.toUpperCase() !== "PREPERATIONS") {
    throw new Error(`Expected path to start with PREPERATIONS, got: ${segments[0]}`);
  }
  return ["PUBLISHED", ...segments.slice(1)];
}

// Walks each path segment from root, creating any folder that doesn't exist yet.
// Returns the item id of the deepest folder.
export async function ensureFolderPath(
  driveId: string,
  segments: string[],
  accessToken: string,
): Promise<string> {
  let parentId = "root";
  let builtPath = "";

  for (const segment of segments) {
    builtPath += `/${segment}`;

    const getRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/root:${builtPath}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (getRes.ok) {
      parentId = (await getRes.json()).id;
      continue;
    }
    if (getRes.status !== 404) {
      throw new Error(`Error checking folder ${builtPath}: ${getRes.status}`);
    }

    const createRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${parentId}/children`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: segment,
          folder: {},
          "@microsoft.graph.conflictBehavior": "fail",
        }),
      },
    );

    if (createRes.status === 409) {
      // Race: someone else created it between our GET and POST — just look it up.
      const retry = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${driveId}/root:${builtPath}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      parentId = (await retry.json()).id;
      continue;
    }
    if (!createRes.ok) {
      throw new Error(`Failed to create folder ${segment}: ${createRes.status} ${await createRes.text()}`);
    }

    parentId = (await createRes.json()).id;
  }

  return parentId;
}

// Looks at existing files in the destination folder to pick the next "-vN" suffix.
export async function nextVersionedFilename(
  driveId: string,
  folderId: string,
  baseName: string, // e.g. "MeetingPacket"
  accessToken: string,
): Promise<string> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${folderId}/children?$select=name`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`Failed to list published folder: ${res.status}`);
  const data = await res.json();

  const pattern = new RegExp(`^${baseName}-v(\\d+)\\.pdf$`, "i");
  let maxVersion = 0;
  for (const child of data.value ?? []) {
    const match = pattern.exec(child.name);
    if (match) maxVersion = Math.max(maxVersion, Number(match[1]));
  }

  return `${baseName}-v${maxVersion + 1}.pdf`;
}

const CHUNK_SIZE = 10 * 327_680; // 3.2MB — must be a multiple of 320 KiB (327680 bytes) per Graph's requirement

export async function createUploadSession(
  driveId: string,
  folderId: string,
  filename: string,
  accessToken: string,
): Promise<string> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${folderId}:/${encodeURIComponent(filename)}:/createUploadSession`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        item: {
          "@microsoft.graph.conflictBehavior": "rename",
        },
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Failed to create upload session: ${res.status} ${await res.text()}`);
  }

  const session = await res.json();
  return session.uploadUrl as string;
}

export async function uploadPacketResumable(
  driveId: string,
  folderId: string,
  filename: string,
  pdfBytes: Uint8Array,
  accessToken: string,
): Promise<{ id: string; webUrl: string; name: string }> {
  const uploadUrl = await createUploadSession(driveId, folderId, filename, accessToken);
  const total = pdfBytes.byteLength;

  let start = 0;
  let lastResult: any = null;

  while (start < total) {
    const end = Math.min(start + CHUNK_SIZE, total);
    const chunk = Buffer.from(pdfBytes.subarray(start, end));

    // uploadUrl is a pre-authenticated SAS-style URL — no Authorization header, no bearer token here
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Length": String(chunk.byteLength),
        "Content-Range": `bytes ${start}-${end - 1}/${total}`,
      },
      body: chunk,
    });

    if (!res.ok && res.status !== 202) {
      throw new Error(`Chunk upload failed at byte ${start}: ${res.status} ${await res.text()}`);
    }

    if (res.status !== 202) {
      // Final chunk — Graph returns the created driveItem
      lastResult = await res.json();
    }

    start = end;
  }

  if (!lastResult) {
    throw new Error("Upload session completed but no driveItem was returned.");
  }

  return lastResult;
}