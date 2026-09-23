// src/lib/pdfPacketBuilder.ts

import {
  PDFContext,
  PDFDocument,
  PDFFont,
  PDFName,
  PDFPage,
  PDFRef,
  PDFString,
  StandardFonts,
  rgb,
} from "pdf-lib";

const OFFICE_CONVERTIBLE = new Set([
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "odt",
  "odp",
  "ods",
  "rtf",
]);

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg"]);

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;

const PAGE_MARGIN_LEFT = 54;
const PAGE_MARGIN_RIGHT = 54;
const PAGE_MARGIN_TOP = 72;
const PAGE_MARGIN_BOTTOM = 54;

const MINI_INDEX_FONT_SIZE = 11;
const MINI_INDEX_LINE_HEIGHT = 17;

const COVER_OUTER_BORDER_INSET = 28;
const COVER_INNER_BORDER_INSET = 36;

const AGENDA_TITLE_SIZE = 22;
const AGENDA_FONT_SIZE = 10.5;
const AGENDA_LINE_HEIGHT = 16;
const AGENDA_INDENT_PER_LEVEL = 18;
const AGENDA_PAGE_NUMBER_WIDTH = 34;

interface DriveChild {
  id: string;
  name: string;
  file?: {
    mimeType?: string;
  };
  folder?: {
    childCount?: number;
  };
}

interface OutlineNode {
  title: string;
  pageRef: PDFRef;
  children: OutlineNode[];
}

interface AgendaEntry {
  id: string;
  title: string;
  depth: number;
  hasContent: boolean;
  kind: PreparedNode["kind"];
}

interface PacketRenderResult {
  outlineNodes: OutlineNode[];

  /**
   * Maps a prepared folder/file ID to the first PDF page generated for it.
   *
   * Empty nodes intentionally have no destination.
   */
  pageDestinations: Map<string, PDFRef>;
}

interface PreparedPdfFile {
  kind: "pdf";
  id: string;
  name: string;
  title: string;
  extension: string;
  hasContent: true;
  sourceDocument: PDFDocument;
}

interface PreparedImageFile {
  kind: "image";
  id: string;
  name: string;
  title: string;
  extension: string;
  hasContent: true;
  bytes: Uint8Array;
}

interface PreparedEmptyFile {
  kind: "empty-file";
  id: string;
  name: string;
  title: string;
  extension: string;
  hasContent: false;
  reason: string;
}

interface PreparedFolder {
  kind: "folder";
  id: string;
  name: string;
  title: string;

  /**
   * Indicates whether this folder contains at least one renderable file
   * anywhere below it.
   *
   * This does not determine whether a top-level section gets a cover page.
   * Top-level section folders always receive a cover page.
   */
  hasContent: boolean;

  children: PreparedNode[];
}

type PreparedFile = PreparedPdfFile | PreparedImageFile | PreparedEmptyFile;

type PreparedNode = PreparedFolder | PreparedFile;

interface CoverPageOptions {
  departmentName: string;
  packetTitle?: string;
  packetSubtitle?: string;
}

function addDepartmentCoverPage(
  merged: PDFDocument,
  boldFont: PDFFont,
  regularFont: PDFFont,
  options: CoverPageOptions,
): PDFPage {
  const page = merged.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const departmentName = options.departmentName.trim();
  const packetTitle = options.packetTitle?.trim() || "MEETING PACKET";

  const packetSubtitle = options.packetSubtitle?.trim() || "";

  // Outer border
  page.drawRectangle({
    x: COVER_OUTER_BORDER_INSET,
    y: COVER_OUTER_BORDER_INSET,
    width: PAGE_WIDTH - COVER_OUTER_BORDER_INSET * 2,
    height: PAGE_HEIGHT - COVER_OUTER_BORDER_INSET * 2,
    borderWidth: 2.25,
    borderColor: rgb(0.12, 0.12, 0.12),
  });

  // Inner border
  page.drawRectangle({
    x: COVER_INNER_BORDER_INSET,
    y: COVER_INNER_BORDER_INSET,
    width: PAGE_WIDTH - COVER_INNER_BORDER_INSET * 2,
    height: PAGE_HEIGHT - COVER_INNER_BORDER_INSET * 2,
    borderWidth: 0.75,
    borderColor: rgb(0.42, 0.42, 0.42),
  });

  // Small decorative horizontal rules
  const ruleWidth = 150;
  const centerX = PAGE_WIDTH / 2;

  page.drawLine({
    start: {
      x: centerX - ruleWidth / 2,
      y: PAGE_HEIGHT / 2 + 92,
    },
    end: {
      x: centerX + ruleWidth / 2,
      y: PAGE_HEIGHT / 2 + 92,
    },
    thickness: 0.8,
    color: rgb(0.45, 0.45, 0.45),
  });

  page.drawLine({
    start: {
      x: centerX - ruleWidth / 2,
      y: PAGE_HEIGHT / 2 - 92,
    },
    end: {
      x: centerX + ruleWidth / 2,
      y: PAGE_HEIGHT / 2 - 92,
    },
    thickness: 0.8,
    color: rgb(0.45, 0.45, 0.45),
  });

  const departmentMaxWidth = PAGE_WIDTH - COVER_INNER_BORDER_INSET * 2 - 70;

  const departmentLines = wrapText(
    departmentName,
    boldFont,
    26,
    departmentMaxWidth,
  );

  const departmentLineHeight = 32;
  const departmentBlockHeight = departmentLines.length * departmentLineHeight;

  let departmentY = PAGE_HEIGHT / 2 + departmentBlockHeight / 2 + 32;

  for (const line of departmentLines) {
    const width = boldFont.widthOfTextAtSize(line, 26);

    page.drawText(line, {
      x: (PAGE_WIDTH - width) / 2,
      y: departmentY,
      size: 26,
      font: boldFont,
      color: rgb(0.08, 0.08, 0.08),
    });

    departmentY -= departmentLineHeight;
  }

  const packetTitleWidth = regularFont.widthOfTextAtSize(packetTitle, 15);

  page.drawText(packetTitle, {
    x: (PAGE_WIDTH - packetTitleWidth) / 2,
    y: PAGE_HEIGHT / 2 - 36,
    size: 15,
    font: regularFont,
    color: rgb(0.28, 0.28, 0.28),
  });

  if (packetSubtitle) {
    const subtitleLines = wrapText(
      packetSubtitle,
      regularFont,
      11,
      departmentMaxWidth,
    );

    let subtitleY = PAGE_HEIGHT / 2 - 67;

    for (const line of subtitleLines) {
      const width = regularFont.widthOfTextAtSize(line, 11);

      page.drawText(line, {
        x: (PAGE_WIDTH - width) / 2,
        y: subtitleY,
        size: 11,
        font: regularFont,
        color: rgb(0.4, 0.4, 0.4),
      });

      subtitleY -= 16;
    }
  }

  return page;
}

function buildAgendaEntries(rootFolder: PreparedFolder): AgendaEntry[] {
  const entries: AgendaEntry[] = [];

  function visit(node: PreparedNode, depth: number): void {
    entries.push({
      id: node.id,
      title: node.title,
      depth,
      hasContent: node.hasContent,
      kind: node.kind,
    });

    if (node.kind === "folder") {
      for (const child of node.children) {
        visit(child, depth + 1);
      }
    }
  }

  for (const child of rootFolder.children) {
    visit(child, 0);
  }

  return entries;
}

function getAgendaEntryLabel(entry: AgendaEntry): string {
  return entry.hasContent ? entry.title : `${entry.title} (Empty)`;
}

function getAgendaEntryTextWidth(entry: AgendaEntry): number {
  const indent = entry.depth * AGENDA_INDENT_PER_LEVEL;

  return (
    PAGE_WIDTH -
    PAGE_MARGIN_LEFT -
    PAGE_MARGIN_RIGHT -
    indent -
    AGENDA_PAGE_NUMBER_WIDTH -
    14
  );
}

function getAgendaEntryLines(
  entry: AgendaEntry,
  regularFont: PDFFont,
): string[] {
  return wrapText(
    getAgendaEntryLabel(entry),
    regularFont,
    AGENDA_FONT_SIZE,
    getAgendaEntryTextWidth(entry),
  );
}

function calculateAgendaPageCount(
  entries: AgendaEntry[],
  regularFont: PDFFont,
): number {
  if (entries.length === 0) {
    return 1;
  }

  const firstPageStartY = PAGE_HEIGHT - PAGE_MARGIN_TOP - 56;

  const continuationPageStartY = PAGE_HEIGHT - PAGE_MARGIN_TOP - 34;

  let pageCount = 1;
  let y = firstPageStartY;

  for (const entry of entries) {
    const lines = getAgendaEntryLines(entry, regularFont);

    const requiredHeight =
      Math.max(1, lines.length) * AGENDA_LINE_HEIGHT +
      (entry.depth === 0 ? 7 : 2);

    if (y - requiredHeight < PAGE_MARGIN_BOTTOM) {
      pageCount += 1;
      y = continuationPageStartY;
    }

    y -= requiredHeight;
  }

  return pageCount;
}

function reserveAgendaPages(merged: PDFDocument, pageCount: number): PDFPage[] {
  const pages: PDFPage[] = [];

  for (let index = 0; index < pageCount; index += 1) {
    pages.push(merged.addPage([PAGE_WIDTH, PAGE_HEIGHT]));
  }

  return pages;
}

function getPageNumberForReference(
  merged: PDFDocument,
  pageRef: PDFRef | undefined,
): number | null {
  if (!pageRef) {
    return null;
  }

  const targetRef = pageRef.toString();

  const pageIndex = merged
    .getPages()
    .findIndex((page) => page.ref.toString() === targetRef);

  if (pageIndex < 0) {
    return null;
  }

  // Human-readable PDF page numbers begin at 1.
  return pageIndex + 1;
}

function drawAgendaEntry(
  page: PDFPage,
  entry: AgendaEntry,
  pageNumber: number | null,
  y: number,
  boldFont: PDFFont,
  regularFont: PDFFont,
): number {
  const indent = entry.depth * AGENDA_INDENT_PER_LEVEL;

  const x = PAGE_MARGIN_LEFT + indent;

  const font = entry.depth === 0 ? boldFont : regularFont;

  const color = entry.hasContent ? rgb(0.12, 0.12, 0.12) : rgb(0.5, 0.5, 0.5);

  const lines = wrapText(
    getAgendaEntryLabel(entry),
    font,
    AGENDA_FONT_SIZE,
    getAgendaEntryTextWidth(entry),
  );

  lines.forEach((line, lineIndex) => {
    page.drawText(line, {
      x,
      y,
      size: AGENDA_FONT_SIZE,
      font,
      color,
    });

    const isLastLine = lineIndex === lines.length - 1;

    if (isLastLine && pageNumber !== null) {
      const pageNumberText = String(pageNumber);

      const pageNumberWidth = regularFont.widthOfTextAtSize(
        pageNumberText,
        AGENDA_FONT_SIZE,
      );

      const pageNumberX = PAGE_WIDTH - PAGE_MARGIN_RIGHT - pageNumberWidth;

      const lineWidth = font.widthOfTextAtSize(line, AGENDA_FONT_SIZE);

      const leaderStartX = x + lineWidth + 7;

      const leaderEndX = pageNumberX - 7;

      const dotWidth = regularFont.widthOfTextAtSize(".", AGENDA_FONT_SIZE);

      if (leaderEndX > leaderStartX && dotWidth > 0) {
        const availableLeaderWidth = leaderEndX - leaderStartX;

        const dotCount = Math.max(
          0,
          Math.floor(availableLeaderWidth / dotWidth),
        );

        if (dotCount > 0) {
          page.drawText(".".repeat(dotCount), {
            x: leaderStartX,
            y,
            size: AGENDA_FONT_SIZE,
            font: regularFont,
            color: rgb(0.55, 0.55, 0.55),
          });
        }
      }

      page.drawText(pageNumberText, {
        x: pageNumberX,
        y,
        size: AGENDA_FONT_SIZE,
        font: regularFont,
        color: rgb(0.15, 0.15, 0.15),
      });
    }

    y -= AGENDA_LINE_HEIGHT;
  });

  if (entry.depth === 0) {
    y -= 7;
  } else {
    y -= 2;
  }

  return y;
}

function drawAgenda(
  merged: PDFDocument,
  agendaPages: PDFPage[],
  entries: AgendaEntry[],
  pageDestinations: Map<string, PDFRef>,
  boldFont: PDFFont,
  regularFont: PDFFont,
): void {
  let pageIndex = 0;
  let page = agendaPages[pageIndex];

  function drawAgendaHeader(
    targetPage: PDFPage,
    continuation: boolean,
  ): number {
    const title = continuation ? "AGENDA - CONTINUED" : "AGENDA";

    targetPage.drawText(title, {
      x: PAGE_MARGIN_LEFT,
      y: PAGE_HEIGHT - PAGE_MARGIN_TOP,
      size: continuation ? 15 : AGENDA_TITLE_SIZE,
      font: boldFont,
      color: rgb(0.08, 0.08, 0.08),
    });

    const ruleY = continuation
      ? PAGE_HEIGHT - PAGE_MARGIN_TOP - 12
      : PAGE_HEIGHT - PAGE_MARGIN_TOP - 18;

    targetPage.drawLine({
      start: {
        x: PAGE_MARGIN_LEFT,
        y: ruleY,
      },
      end: {
        x: PAGE_WIDTH - PAGE_MARGIN_RIGHT,
        y: ruleY,
      },
      thickness: 0.9,
      color: rgb(0.55, 0.55, 0.55),
    });

    return continuation
      ? PAGE_HEIGHT - PAGE_MARGIN_TOP - 34
      : PAGE_HEIGHT - PAGE_MARGIN_TOP - 56;
  }

  let y = drawAgendaHeader(page, false);

  if (entries.length === 0) {
    page.drawText("No agenda items", {
      x: PAGE_MARGIN_LEFT,
      y,
      size: 11,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    return;
  }

  for (const entry of entries) {
    const lines = getAgendaEntryLines(entry, regularFont);

    const requiredHeight =
      Math.max(1, lines.length) * AGENDA_LINE_HEIGHT +
      (entry.depth === 0 ? 7 : 2);

    if (y - requiredHeight < PAGE_MARGIN_BOTTOM) {
      pageIndex += 1;

      const nextPage = agendaPages[pageIndex];

      if (!nextPage) {
        throw new Error(
          "Agenda page calculation underestimated the required page count.",
        );
      }

      page = nextPage;

      y = drawAgendaHeader(page, true);
    }

    const destination = pageDestinations.get(entry.id);

    const destinationPageNumber = getPageNumberForReference(
      merged,
      destination,
    );

    y = drawAgendaEntry(
      page,
      entry,
      destinationPageNumber,
      y,
      boldFont,
      regularFont,
    );
  }
}

function naturalSort(a: DriveChild, b: DriveChild): number {
  return a.name.localeCompare(b.name, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function naturalSortPrepared(a: PreparedNode, b: PreparedNode): number {
  return a.name.localeCompare(b.name, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function stripExtension(name: string): string {
  return name.replace(/\.[^./]+$/, "");
}

function getExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function getNodeDisplayTitle(node: PreparedNode): string {
  return node.title;
}

function getNodeIndexLabel(node: PreparedNode): string {
  const title = getNodeDisplayTitle(node);

  if (!node.hasContent) {
    return `${title} (Empty)`;
  }

  return title;
}

/**
 * Lists every child in a Graph folder.
 *
 * Graph may paginate large folders, so this follows @odata.nextLink until
 * there are no additional pages.
 */
async function fetchChildren(
  siteId: string,
  driveId: string,
  folderId: string,
  accessToken: string,
): Promise<DriveChild[]> {
  const children: DriveChild[] = [];

  let url: string | null =
    `https://graph.microsoft.com/v1.0/sites/${encodeURIComponent(siteId)}` +
    `/drives/${encodeURIComponent(driveId)}` +
    `/items/${encodeURIComponent(folderId)}` +
    "/children?$select=id,name,file,folder&$top=200";

  while (url) {
    const response: Response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => "");

      throw new Error(
        `Failed to list folder ${folderId}: ` +
          `${response.status} ${response.statusText}` +
          (responseText ? ` - ${responseText}` : ""),
      );
    }

    const data = (await response.json()) as {
      value?: DriveChild[];
      "@odata.nextLink"?: string;
    };

    children.push(...(data.value ?? []));
    url = data["@odata.nextLink"] ?? null;
  }

  return children.sort(naturalSort);
}

/**
 * Downloads a PDF directly or asks Graph to convert an Office document
 * to PDF.
 */
async function fetchAsPdfBytes(
  driveId: string,
  itemId: string,
  extension: string,
  accessToken: string,
): Promise<Uint8Array | null> {
  const itemUrl =
    `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}` +
    `/items/${encodeURIComponent(itemId)}`;

  const url =
    extension === "pdf"
      ? `${itemUrl}/content`
      : `${itemUrl}/content?format=pdf`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");

    console.warn(
      `Skipping item ${itemId}: PDF conversion/download failed ` +
        `(${response.status} ${response.statusText})` +
        (responseText ? ` - ${responseText}` : ""),
    );

    return null;
  }

  return new Uint8Array(await response.arrayBuffer());
}

async function fetchRawFileBytes(
  driveId: string,
  itemId: string,
  accessToken: string,
): Promise<Uint8Array | null> {
  const url =
    `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}` +
    `/items/${encodeURIComponent(itemId)}/content`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");

    console.warn(
      `Skipping item ${itemId}: download failed ` +
        `(${response.status} ${response.statusText})` +
        (responseText ? ` - ${responseText}` : ""),
    );

    return null;
  }

  return new Uint8Array(await response.arrayBuffer());
}

// -----------------------------------------------------------------------------
// Pass 1: Prepare the entire tree
// -----------------------------------------------------------------------------

/**
 * Downloads and validates a file before rendering begins.
 *
 * This lets us know whether the file can actually contribute pages before
 * deciding whether its containing folder should receive a cover page.
 */
async function prepareFile(
  driveId: string,
  child: DriveChild,
  accessToken: string,
): Promise<PreparedFile> {
  const extension = getExtension(child.name);
  const title = stripExtension(child.name);

  if (extension === "pdf" || OFFICE_CONVERTIBLE.has(extension)) {
    const bytes = await fetchAsPdfBytes(
      driveId,
      child.id,
      extension,
      accessToken,
    );

    if (!bytes) {
      return {
        kind: "empty-file",
        id: child.id,
        name: child.name,
        title,
        extension,
        hasContent: false,
        reason: "Download or PDF conversion failed",
      };
    }

    try {
      const sourceDocument = await PDFDocument.load(bytes, {
        ignoreEncryption: false,
        updateMetadata: false,
      });

      if (sourceDocument.getPageCount() === 0) {
        return {
          kind: "empty-file",
          id: child.id,
          name: child.name,
          title,
          extension,
          hasContent: false,
          reason: "PDF contains no pages",
        };
      }

      return {
        kind: "pdf",
        id: child.id,
        name: child.name,
        title,
        extension,
        hasContent: true,
        sourceDocument,
      };
    } catch (error) {
      console.warn(`Unable to load PDF content for ${child.name}:`, error);

      return {
        kind: "empty-file",
        id: child.id,
        name: child.name,
        title,
        extension,
        hasContent: false,
        reason: "Downloaded content is not a readable PDF",
      };
    }
  }

  if (IMAGE_EXTENSIONS.has(extension)) {
    const bytes = await fetchRawFileBytes(driveId, child.id, accessToken);

    if (!bytes || bytes.length === 0) {
      return {
        kind: "empty-file",
        id: child.id,
        name: child.name,
        title,
        extension,
        hasContent: false,
        reason: "Image download failed",
      };
    }

    return {
      kind: "image",
      id: child.id,
      name: child.name,
      title,
      extension,
      hasContent: true,
      bytes,
    };
  }

  console.warn(`Skipping unsupported file type: ${child.name}`);

  return {
    kind: "empty-file",
    id: child.id,
    name: child.name,
    title,
    extension,
    hasContent: false,
    reason: extension
      ? `Unsupported file type: .${extension}`
      : "File has no extension",
  };
}

/**
 * Recursively downloads and prepares an entire folder tree.
 *
 * A folder has content only when at least one descendant file can actually
 * contribute one or more pages.
 */
async function prepareFolderTree(
  siteId: string,
  driveId: string,
  folderId: string,
  accessToken: string,
  folderName: string,
): Promise<PreparedFolder> {
  const driveChildren = await fetchChildren(
    siteId,
    driveId,
    folderId,
    accessToken,
  );

  const preparedChildren: PreparedNode[] = [];

  /*
   * This intentionally processes items sequentially.
   *
   * Sequential processing:
   * - preserves predictable Graph traffic
   * - avoids launching hundreds of Office conversions simultaneously
   * - reduces peak memory pressure
   *
   * A small concurrency limiter could be added later if packet preparation
   * becomes too slow.
   */
  for (const child of driveChildren) {
    try {
      if (child.folder) {
        const folder = await prepareFolderTree(
          siteId,
          driveId,
          child.id,
          accessToken,
          child.name,
        );

        preparedChildren.push(folder);
        continue;
      }

      if (child.file) {
        const file = await prepareFile(driveId, child, accessToken);

        preparedChildren.push(file);
      }
    } catch (error) {
      console.error(`Failed to prepare ${child.name}:`, error);

      preparedChildren.push({
        kind: "empty-file",
        id: child.id,
        name: child.name,
        title: stripExtension(child.name),
        extension: getExtension(child.name),
        hasContent: false,
        reason:
          error instanceof Error ? error.message : "Unknown preparation error",
      });
    }
  }

  preparedChildren.sort(naturalSortPrepared);

  return {
    kind: "folder",
    id: folderId,
    name: folderName,
    title: folderName,
    hasContent: preparedChildren.some((child) => child.hasContent),
    children: preparedChildren,
  };
}

// -----------------------------------------------------------------------------
// Text layout helpers
// -----------------------------------------------------------------------------

function splitLongToken(
  token: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
): string[] {
  const pieces: string[] = [];
  let current = "";

  for (const character of token) {
    const candidate = current + character;
    const width = font.widthOfTextAtSize(candidate, fontSize);

    if (current && width > maxWidth) {
      pieces.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }

  if (current) {
    pieces.push(current);
  }

  return pieces;
}

function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
): string[] {
  const rawWords = text.trim().split(/\s+/);
  const words: string[] = [];

  for (const rawWord of rawWords) {
    if (font.widthOfTextAtSize(rawWord, fontSize) <= maxWidth) {
      words.push(rawWord);
    } else {
      words.push(...splitLongToken(rawWord, font, fontSize, maxWidth));
    }
  }

  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (currentLine && font.widthOfTextAtSize(candidate, fontSize) > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [""];
}

// -----------------------------------------------------------------------------
// Pass 2: Render the prepared tree
// -----------------------------------------------------------------------------

interface SectionCoverResult {
  firstPage: PDFPage;
  finalPage: PDFPage;
  finalY: number;
}

/**
 * Creates a section cover and draws a mini index of its immediate children.
 *
 * Empty children are shown as:
 *
 *     a. AI Committee (Empty)
 *
 * They do not receive any page of their own.
 */
function addSectionCover(
  merged: PDFDocument,
  boldFont: PDFFont,
  regularFont: PDFFont,
  folder: PreparedFolder,
  depth: number,
): SectionCoverResult {
  const firstPage = merged.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  let currentPage = firstPage;
  let y = PAGE_HEIGHT - PAGE_MARGIN_TOP;

  const titleIndent = Math.min((depth - 1) * 16, 64);
  const titleX = PAGE_MARGIN_LEFT + titleIndent;
  const titleWidth = PAGE_WIDTH - titleX - PAGE_MARGIN_RIGHT;

  const titleFontSize = depth <= 1 ? 20 : 16;
  const titleLines = wrapText(
    folder.title,
    boldFont,
    titleFontSize,
    titleWidth,
  );

  for (const line of titleLines) {
    currentPage.drawText(line, {
      x: titleX,
      y,
      size: titleFontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    y -= titleFontSize + 5;
  }

  currentPage.drawLine({
    start: {
      x: titleX,
      y: y - 2,
    },
    end: {
      x: PAGE_WIDTH - PAGE_MARGIN_RIGHT,
      y: y - 2,
    },
    thickness: 1,
    color: rgb(0.65, 0.65, 0.65),
  });

  y -= 28;

  if (folder.children.length === 0) {
    currentPage.drawText("Empty", {
      x: titleX + 18,
      y,
      size: MINI_INDEX_FONT_SIZE,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    return {
      firstPage,
      finalPage: currentPage,
      finalY: y - MINI_INDEX_LINE_HEIGHT,
    };
  }

  const indexX = titleX + 18;
  const indexWidth = PAGE_WIDTH - indexX - PAGE_MARGIN_RIGHT;

  for (const child of folder.children) {
    const label = getNodeIndexLabel(child);

    const lines = wrapText(
      label,
      regularFont,
      MINI_INDEX_FONT_SIZE,
      indexWidth,
    );

    const requiredHeight = lines.length * MINI_INDEX_LINE_HEIGHT;

    if (y - requiredHeight < PAGE_MARGIN_BOTTOM) {
      currentPage = merged.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - PAGE_MARGIN_TOP;

      const continuationTitle = `${folder.title} - continued`;

      const continuationLines = wrapText(
        continuationTitle,
        boldFont,
        14,
        PAGE_WIDTH - PAGE_MARGIN_LEFT - PAGE_MARGIN_RIGHT,
      );

      for (const line of continuationLines) {
        currentPage.drawText(line, {
          x: PAGE_MARGIN_LEFT,
          y,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });

        y -= 19;
      }

      y -= 12;
    }

    const isEmpty = !child.hasContent;

    for (const line of lines) {
      currentPage.drawText(line, {
        x: indexX,
        y,
        size: MINI_INDEX_FONT_SIZE,
        font: regularFont,
        color: isEmpty ? rgb(0.5, 0.5, 0.5) : rgb(0.1, 0.1, 0.1),
      });

      y -= MINI_INDEX_LINE_HEIGHT;
    }
  }

  return {
    firstPage,
    finalPage: currentPage,
    finalY: y,
  };
}

async function appendPreparedFile(
  merged: PDFDocument,
  file: PreparedFile,
): Promise<PDFRef | null> {
  if (!file.hasContent) {
    return null;
  }

  if (file.kind === "pdf") {
    const sourcePageIndices = file.sourceDocument.getPageIndices();

    if (sourcePageIndices.length === 0) {
      return null;
    }

    const copiedPages = await merged.copyPages(
      file.sourceDocument,
      sourcePageIndices,
    );

    for (const page of copiedPages) {
      merged.addPage(page);
    }

    return copiedPages[0]?.ref ?? null;
  }

  if (file.kind === "image") {
    try {
      const image =
        file.extension === "png"
          ? await merged.embedPng(file.bytes)
          : await merged.embedJpg(file.bytes);

      /*
       * Preserve the original image aspect ratio, but constrain it to a normal
       * letter-size PDF page.
       */
      const availableWidth = PAGE_WIDTH - PAGE_MARGIN_LEFT - PAGE_MARGIN_RIGHT;

      const availableHeight =
        PAGE_HEIGHT - PAGE_MARGIN_TOP - PAGE_MARGIN_BOTTOM;

      const scale = Math.min(
        availableWidth / image.width,
        availableHeight / image.height,
        1,
      );

      const renderedWidth = image.width * scale;
      const renderedHeight = image.height * scale;

      const page = merged.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

      page.drawImage(image, {
        x: (PAGE_WIDTH - renderedWidth) / 2,
        y: (PAGE_HEIGHT - renderedHeight) / 2,
        width: renderedWidth,
        height: renderedHeight,
      });

      return page.ref;
    } catch (error) {
      console.error(`Unable to embed image ${file.name}:`, error);
      return null;
    }
  }

  return null;
}

/**
 * Renders a prepared folder.
 *
 * Normal nested behavior:
 * - Folder with content: cover page plus mini index, then content
 * - Folder without content: no page
 *
 * Top-level behavior:
 * - forceCover is true
 * - The section always receives a cover page
 * - Empty immediate children are listed in the mini index
 * - Empty immediate children receive no pages
 */
async function renderFolder(
  merged: PDFDocument,
  folder: PreparedFolder,
  depth: number,
  boldFont: PDFFont,
  regularFont: PDFFont,
  pageDestinations: Map<string, PDFRef>,
  forceCover = false,
): Promise<OutlineNode | null> {
  if (!forceCover && !folder.hasContent) {
    return null;
  }

  const cover = addSectionCover(
    merged,
    boldFont,
    regularFont,
    folder,
    depth,
  );

  pageDestinations.set(
    folder.id,
    cover.firstPage.ref,
  );

  const outlineNode: OutlineNode = {
    title: folder.title,
    pageRef: cover.firstPage.ref,
    children: [],
  };

  for (const child of folder.children) {
    if (!child.hasContent) {
      continue;
    }

    if (child.kind === "folder") {
      const childFolderOutline =
        await renderFolder(
          merged,
          child,
          depth + 1,
          boldFont,
          regularFont,
          pageDestinations,
          false,
        );

      if (childFolderOutline) {
        outlineNode.children.push(
          childFolderOutline,
        );
      }

      continue;
    }

    const firstPageRef =
      await appendPreparedFile(
        merged,
        child,
      );

    if (firstPageRef) {
      pageDestinations.set(
        child.id,
        firstPageRef,
      );

      outlineNode.children.push({
        title: child.title,
        pageRef: firstPageRef,
        children: [],
      });
    }
  }

  return outlineNode;
}

/**
 * Renders the invisible packet root.
 *
 * Immediate child folders are considered packet sections and always get a
 * cover page, even when their only children are empty folders.
 */
async function renderRootFolder(
  merged: PDFDocument,
  rootFolder: PreparedFolder,
  boldFont: PDFFont,
  regularFont: PDFFont,
): Promise<PacketRenderResult> {
  const outlineNodes: OutlineNode[] = [];
  const pageDestinations =
    new Map<string, PDFRef>();

  for (const child of rootFolder.children) {
    if (child.kind === "folder") {
      const sectionOutline =
        await renderFolder(
          merged,
          child,
          1,
          boldFont,
          regularFont,
          pageDestinations,
          true,
        );

      if (sectionOutline) {
        outlineNodes.push(sectionOutline);
      }

      continue;
    }

    if (!child.hasContent) {
      continue;
    }

    const firstPageRef =
      await appendPreparedFile(
        merged,
        child,
      );

    if (firstPageRef) {
      pageDestinations.set(
        child.id,
        firstPageRef,
      );

      outlineNodes.push({
        title: child.title,
        pageRef: firstPageRef,
        children: [],
      });
    }
  }

  return {
    outlineNodes,
    pageDestinations,
  };
}

// -----------------------------------------------------------------------------
// PDF outline/sidebar bookmarks
// -----------------------------------------------------------------------------

interface OutlineLevelResult {
  first: PDFRef;
  last: PDFRef;

  /**
   * Number of descendants contained below this level.
   *
   * For an outline item, a positive Count means its children should initially
   * appear expanded.
   */
  count: number;
}

function createOutlineLevel(
  context: PDFContext,
  nodes: OutlineNode[],
  parentRef: PDFRef,
): OutlineLevelResult | null {
  if (nodes.length === 0) {
    return null;
  }

  const entries = nodes.map((node) => {
    const dictionary = context.obj({});
    const reference = context.register(dictionary);

    return {
      node,
      dictionary,
      reference,
    };
  });

  let totalCount = entries.length;

  entries.forEach((entry, index) => {
    const { node, dictionary, reference } = entry;

    dictionary.set(PDFName.of("Title"), PDFString.of(node.title));

    dictionary.set(PDFName.of("Parent"), parentRef);

    dictionary.set(
      PDFName.of("Dest"),
      context.obj([node.pageRef, PDFName.of("Fit")]),
    );

    if (index > 0) {
      dictionary.set(PDFName.of("Prev"), entries[index - 1].reference);
    }

    if (index < entries.length - 1) {
      dictionary.set(PDFName.of("Next"), entries[index + 1].reference);
    }

    const childLevel = createOutlineLevel(context, node.children, reference);

    if (childLevel) {
      dictionary.set(PDFName.of("First"), childLevel.first);

      dictionary.set(PDFName.of("Last"), childLevel.last);

      dictionary.set(PDFName.of("Count"), context.obj(childLevel.count));

      totalCount += childLevel.count;
    }
  });

  return {
    first: entries[0].reference,
    last: entries[entries.length - 1].reference,
    count: totalCount,
  };
}

function buildOutline(merged: PDFDocument, rootNodes: OutlineNode[]): void {
  if (rootNodes.length === 0) {
    return;
  }

  const context = merged.context;

  const outlinesDictionary = context.obj({});
  const outlinesReference = context.register(outlinesDictionary);

  const topLevel = createOutlineLevel(context, rootNodes, outlinesReference);

  if (!topLevel) {
    return;
  }

  outlinesDictionary.set(PDFName.of("Type"), PDFName.of("Outlines"));

  outlinesDictionary.set(PDFName.of("First"), topLevel.first);

  outlinesDictionary.set(PDFName.of("Last"), topLevel.last);

  outlinesDictionary.set(PDFName.of("Count"), context.obj(topLevel.count));

  merged.catalog.set(PDFName.of("Outlines"), outlinesReference);

  merged.catalog.set(PDFName.of("PageMode"), PDFName.of("UseOutlines"));
}

// -----------------------------------------------------------------------------
// Public builder
// -----------------------------------------------------------------------------

export interface BuildMergedPacketOptions {
  departmentName: string;
  packetTitle?: string;
  packetSubtitle?: string;
}

export async function buildMergedPacket(
  siteId: string,
  driveId: string,
  folderId: string,
  accessToken: string,
  options: BuildMergedPacketOptions,
): Promise<Uint8Array> {
  if (!options.departmentName.trim()) {
    throw new Error(
      "A department name is required to build the packet cover.",
    );
  }

  /*
   * Pass 1:
   * Prepare the complete folder and file tree.
   */
  const rootFolder = await prepareFolderTree(
    siteId,
    driveId,
    folderId,
    accessToken,
    "Packet Root",
  );

  const merged = await PDFDocument.create();

  const boldFont = await merged.embedFont(
    StandardFonts.HelveticaBold,
  );

  const regularFont = await merged.embedFont(
    StandardFonts.Helvetica,
  );

  /*
   * Page 1:
   * Department cover.
   *
   * Keep the returned page so its PDF reference can be added
   * to the sidebar outline.
   */
  const coverPage = addDepartmentCoverPage(
    merged,
    boldFont,
    regularFont,
    {
      departmentName: options.departmentName,
      packetTitle: options.packetTitle,
      packetSubtitle: options.packetSubtitle,
    },
  );

  /*
   * Build the complete logical agenda, including empty nodes.
   */
  const agendaEntries = buildAgendaEntries(
    rootFolder,
  );

  /*
   * Reserve agenda pages before rendering packet content so all
   * later content receives its final page position.
   */
  const agendaPageCount = calculateAgendaPageCount(
    agendaEntries,
    regularFont,
  );

  const agendaPages = reserveAgendaPages(
    merged,
    agendaPageCount,
  );

  /*
   * Render section covers and source documents.
   */
  const {
    outlineNodes,
    pageDestinations,
  } = await renderRootFolder(
    merged,
    rootFolder,
    boldFont,
    regularFont,
  );

  /*
   * Fill the reserved agenda pages after every content destination
   * has a final PDF page number.
   */
  drawAgenda(
    merged,
    agendaPages,
    agendaEntries,
    pageDestinations,
    boldFont,
    regularFont,
  );

  /*
   * Prepend the PDF front matter to the sidebar outline.
   *
   * Agenda is guaranteed to have at least one page because
   * calculateAgendaPageCount() returns at least 1.
   */
  const completeOutlineNodes: OutlineNode[] = [
  {
    title: "Cover Page",
    pageRef: coverPage.ref,
    children: [],
  },
  {
    title: "Agenda",
    pageRef: agendaPages[0].ref,
    children: [],
  },
  ...outlineNodes,
];

buildOutline(
  merged,
  completeOutlineNodes,
);

  return merged.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
  });
}
