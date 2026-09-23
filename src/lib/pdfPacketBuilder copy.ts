// src/lib/pdfPacketBuilder.ts

import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFFont,
  PDFPage,
  PDFRef,
  PDFContext,
  PDFName,
  PDFString,
} from "pdf-lib";

const OFFICE_CONVERTIBLE = new Set([
  "doc", "docx", "ppt", "pptx", "xls", "xlsx", "odt", "odp", "ods", "rtf",
]);
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg"]);

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;

interface DriveChild {
  id: string;
  name: string;
  file?: { mimeType?: string };
  folder?: { childCount?: number };
}

// One node per section/sub-point/file that should show up in the sidebar.
interface OutlineNode {
  title: string;
  pageRef: PDFRef;
  children: OutlineNode[];
}

// Natural sort so "1., 2., ..., 10." order correctly instead of "1., 10., 2."
function naturalSort(a: DriveChild, b: DriveChild): number {
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
}

function stripExtension(name: string): string {
  return name.replace(/\.[^./]+$/, "");
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
  // Returns files AND subfolders — we need both to build sections/sub-points.
  return (data.value ?? []) as DriveChild[];
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

/**
 * Draws a divider page for a folder ("2. Executive Directors Report",
 * "a. AI Committee", etc.) and returns it so the caller can stamp "Empty"
 * onto it later if the folder turns out to have no content.
 */
function addDividerPage(
  merged: PDFDocument,
  boldFont: PDFFont,
  regularFont: PDFFont,
  title: string,
  depth: number,
): PDFPage {
  const page = merged.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const leftMargin = 54 + depth * 24;
  const isTopLevel = depth <= 1;
  const fontSize = isTopLevel ? 20 : 14;
  const font = isTopLevel ? boldFont : regularFont;
  const y = PAGE_HEIGHT - 100 - depth * 20;

  page.drawText(title, { x: leftMargin, y, size: fontSize, font, color: rgb(0, 0, 0) });

  if (isTopLevel) {
    page.drawLine({
      start: { x: leftMargin, y: y - 10 },
      end: { x: PAGE_WIDTH - 54, y: y - 10 },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });
  }

  return page;
}

function markEmpty(page: PDFPage, regularFont: PDFFont, depth: number) {
  const leftMargin = 54 + depth * 24;
  page.drawText("Empty", {
    x: leftMargin,
    y: PAGE_HEIGHT - 100 - depth * 20 - 28,
    size: 12,
    font: regularFont,
    color: rgb(0.5, 0.5, 0.5),
  });
}

/** Merges/embeds one file's content and returns the ref of its FIRST page (for outline linking), or null if skipped. */
async function appendFile(
  merged: PDFDocument,
  driveId: string,
  child: DriveChild,
  accessToken: string,
): Promise<PDFRef | null> {
  const ext = child.name.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "pdf" || OFFICE_CONVERTIBLE.has(ext)) {
    const bytes = await fetchAsPdfBytes(driveId, child.id, ext, accessToken);
    if (!bytes) return null;
    const source = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
    return pages[0]?.ref ?? null;
  }

  if (IMAGE_EXTENSIONS.has(ext)) {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${child.id}/content`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) return null;
    const imgBytes = new Uint8Array(await res.arrayBuffer());
    const image = ext === "png"
      ? await merged.embedPng(imgBytes)
      : await merged.embedJpg(imgBytes);
    const page = merged.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    return page.ref;
  }

  console.warn(`Skipping unsupported file type: ${child.name}`);
  return null;
}

/**
 * Recursively walks a folder. Every folder gets a divider page + outline node.
 * Every file gets merged in as content pages + its own outline node (so the
 * sidebar shows sections, sub-point folders, AND individual documents).
 * If a folder ends up with zero content pages, "Empty" is stamped on its divider.
 *
 * `outlineChildren` is the array THIS folder's own outline node should be
 * pushed into (its parent's children list, or the top-level list at the root).
 */
async function processFolder(
  merged: PDFDocument,
  siteId: string,
  driveId: string,
  folderId: string,
  accessToken: string,
  title: string | null,
  depth: number,
  boldFont: PDFFont,
  regularFont: PDFFont,
  outlineChildren: OutlineNode[],
): Promise<void> {
  let dividerPage: PDFPage | null = null;
  let node: OutlineNode | null = null;

  if (title !== null) {
    dividerPage = addDividerPage(merged, boldFont, regularFont, title, depth);
    node = { title, pageRef: dividerPage.ref, children: [] };
    outlineChildren.push(node);
  }

  const pageCountBefore = merged.getPageCount();

  const children = await fetchChildren(siteId, driveId, folderId, accessToken);
  children.sort(naturalSort);

  // Subfolders/files nest under this folder's outline node; at the root
  // (no divider/node created) they go straight into the top-level list.
  const childOutlineTarget = node ? node.children : outlineChildren;

  for (const child of children) {
    if (child.folder) {
      await processFolder(
        merged, siteId, driveId, child.id, accessToken,
        child.name, depth + 1, boldFont, regularFont,
        childOutlineTarget,
      );
    } else if (child.file) {
      const firstPageRef = await appendFile(merged, driveId, child, accessToken);
      if (firstPageRef) {
        childOutlineTarget.push({
          title: stripExtension(child.name),
          pageRef: firstPageRef,
          children: [],
        });
      }
    }
  }

  if (dividerPage && merged.getPageCount() === pageCountBefore) {
    markEmpty(dividerPage, regularFont, depth);
  }
}

// ---- Outline (sidebar bookmarks) construction -----------------------------

/** Builds one level of outline items (siblings), linking Next/Prev/Parent, and recursing into children. */
function createOutlineLevel(
  context: PDFContext,
  nodes: OutlineNode[],
  parentRef: PDFRef,
): { first: PDFRef; last: PDFRef; count: number } | null {
  if (nodes.length === 0) return null;

  const entries = nodes.map((node) => {
    const dict = context.obj({});
    const ref = context.register(dict);
    return { node, dict, ref };
  });

  let totalCount = entries.length;

  entries.forEach(({ node, dict, ref }, i) => {
    dict.set(PDFName.of("Title"), PDFString.of(node.title));
    dict.set(PDFName.of("Parent"), parentRef);
    dict.set(PDFName.of("Dest"), context.obj([node.pageRef, PDFName.of("Fit")]));
    if (i > 0) dict.set(PDFName.of("Prev"), entries[i - 1].ref);
    if (i < entries.length - 1) dict.set(PDFName.of("Next"), entries[i + 1].ref);

    const childLevel = createOutlineLevel(context, node.children, ref);
    if (childLevel) {
      dict.set(PDFName.of("First"), childLevel.first);
      dict.set(PDFName.of("Last"), childLevel.last);
      dict.set(PDFName.of("Count"), context.obj(childLevel.count));
      totalCount += childLevel.count;
    }
  });

  return { first: entries[0].ref, last: entries[entries.length - 1].ref, count: totalCount };
}

/** Attaches the outline tree to the document's catalog and sets the viewer to open with the sidebar visible. */
function buildOutline(merged: PDFDocument, rootNodes: OutlineNode[]): void {
  if (rootNodes.length === 0) return;
  const context = merged.context;

  const outlinesDict = context.obj({});
  const outlinesRef = context.register(outlinesDict);

  const top = createOutlineLevel(context, rootNodes, outlinesRef);
  if (!top) return;

  outlinesDict.set(PDFName.of("Type"), PDFName.of("Outlines"));
  outlinesDict.set(PDFName.of("First"), top.first);
  outlinesDict.set(PDFName.of("Last"), top.last);
  outlinesDict.set(PDFName.of("Count"), context.obj(top.count));

  merged.catalog.set(PDFName.of("Outlines"), outlinesRef);
  merged.catalog.set(PDFName.of("PageMode"), PDFName.of("UseOutlines"));
}

// -----------------------------------------------------------------------------

export async function buildMergedPacket(
  siteId: string,
  driveId: string,
  folderId: string,
  accessToken: string,
): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  const boldFont = await merged.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await merged.embedFont(StandardFonts.Helvetica);
  const rootNodes: OutlineNode[] = [];

  // Root folder (e.g. "09-22") gets no divider of its own — its direct
  // children ("1. Approval of the Minutes", "2. Executive Directors Report", ...)
  // become the depth-1 section headers and top-level outline items.
  await processFolder(
    merged, siteId, driveId, folderId, accessToken,
    null, 0, boldFont, regularFont,
    rootNodes,
  );

  buildOutline(merged, rootNodes);

  return merged.save();
}