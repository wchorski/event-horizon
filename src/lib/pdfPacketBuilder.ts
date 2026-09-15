// src/lib/pdfPacketBuilder.ts
import { PDFDocument } from "pdf-lib";

const OFFICE_CONVERTIBLE = new Set([
  "doc", "docx", "ppt", "pptx", "xls", "xlsx", "odt", "odp", "ods", "rtf",
]);
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg"]);

interface DriveChild {
  id: string;
  name: string;
  file?: { mimeType?: string };
}

async function fetchChildren(
  siteId: string,
  driveId: string,
  folderId: string,
  accessToken: string,
): Promise<DriveChild[]> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/items/${folderId}/children`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`Failed to list folder: ${res.status}`);
  const data = await res.json();
  return (data.value ?? []).filter((item: any) => item.file); // files only, skip subfolders
}

async function fetchAsPdfBytes(
  driveId: string,
  itemId: string,
  ext: string,
  accessToken: string,
): Promise<Uint8Array | null> {
  const isPdf = ext === "pdf";
  const url = isPdf
    ? `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/content`
    : `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/content?format=pdf`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    console.warn(`Skipping ${itemId}: conversion/download failed (${res.status})`);
    return null;
  }
  return new Uint8Array(await res.arrayBuffer());
}

export async function buildMergedPacket(
  siteId: string,
  driveId: string,
  folderId: string,
  accessToken: string,
): Promise<Uint8Array> {
  const children = await fetchChildren(siteId, driveId, folderId, accessToken);

  // Deterministic order — alphabetical by name. Swap for createdDateTime if you'd rather sort by upload order.
  children.sort((a, b) => a.name.localeCompare(b.name));

  const merged = await PDFDocument.create();

  for (const child of children) {
    const ext = child.name.split(".").pop()?.toLowerCase() ?? "";

    if (ext === "pdf" || OFFICE_CONVERTIBLE.has(ext)) {
      const bytes = await fetchAsPdfBytes(driveId, child.id, ext, accessToken);
      if (!bytes) continue;

      const source = await PDFDocument.load(bytes);
      const pages = await merged.copyPages(source, source.getPageIndices());
      pages.forEach((page) => merged.addPage(page));
    } else if (IMAGE_EXTENSIONS.has(ext)) {
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${child.id}/content`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) continue;
      const imgBytes = new Uint8Array(await res.arrayBuffer());

      const image = ext === "png"
        ? await merged.embedPng(imgBytes)
        : await merged.embedJpg(imgBytes);

      const page = merged.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    } else {
      console.warn(`Skipping unsupported file type: ${child.name}`);
    }
  }

  return merged.save();
}