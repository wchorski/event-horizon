// lib/crud/createPacket.ts
import { db } from "@db/db";
import { integrationCredential as IntegrationCredential, meetingPacket as MeetingPacket } from "@db/schema";
import { msAuthentication } from "@lib/auth/msAuthentication";
import { decryptSecret } from "@lib/auth/secretBox";
import { isDayFolder } from "@lib/dayFolderCheck";
import { NotFoundError, BadRequestError } from "@lib/errors";
import { updateEventPacketLink } from "@lib/microsoft/outlookPacketLink";
import { buildMergedPacket } from "@lib/pdfPacketBuilder";
import {
  getFullPath,
  mirrorToPublished,
  ensureFolderPath,
  nextVersionedFilename,
  uploadPacketResumable,
} from "@lib/publishPacket";
// import type { organization } from "better-auth/plugins";
import { and, eq } from "drizzle-orm";
import type { SessionOrganization } from "../../env";

type Props = {
  organization: NonNullable<SessionOrganization>;
  folderId: string;
  origin: string;
};

export async function createMeetingPacket(props: Props) {
  const {
    organization,
    folderId,
    origin,
  } = props;

  const { sharepointSiteId, sharepointDriveId, mailboxUserEmail } = organization;
  if (!sharepointSiteId || !sharepointDriveId)
    throw new BadRequestError("organization is missing ms site or drive ids.");

  const integrationCredential = await db.query.integrationCredential.findFirst({
    where: {
      organizationId: organization.id,
      provider: 'microsoft'
    }
  });

  if (!integrationCredential)
    throw new NotFoundError(
      `❌ ${"microsoft"} integration is not setup for ${organization.name} `,
    );

  const { tenantId, clientId, secretAuthTag, secretCiphertext, secretIv } =
    integrationCredential;

  const integrationSecret = decryptSecret(
    secretCiphertext,
    secretIv,
    secretAuthTag,
  );

  const accessToken = await msAuthentication(
    tenantId,
    clientId,
    integrationSecret,
  );

  const endpoint = `https://graph.microsoft.com/v1.0/sites/${sharepointSiteId}/drives/${sharepointDriveId}/items/${encodeURIComponent(folderId)}?$select=name,parentReference`;

  // TODO use msGraphFetch()
  const res = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new BadRequestError(`Could not load folder: ${res.status} ${text}`);
  }

  const item = await res.json();
  // console.log({ item });

  // item.parentReference.path looks like ".../root:/PREPERATIONS/MOEITS Board/2026"
  const parentSegments = item.parentReference.path.split("/");
  const parentName = parentSegments[parentSegments.length - 1];
  const departmentName = parentSegments[parentSegments.length - 2];

  if (!isDayFolder([{ name: parentName }, { name: item.name }])) {
    throw new BadRequestError("Events can only be linked to day folders.");
  }

  const existingPacket = await db.query.meetingPacket.findFirst({
    where: {
      // TODO idk if i need to set this on meeting packet
      // sharepointDriveId: sharepointDriveId,
      sharepointFolderId: folderId
    }
  });
  console.log({existingPacket});

  if (!existingPacket) {
    throw new BadRequestError(
      "This folder isn't linked to a calendar event yet. Create a calendar event before building a packet.",
    );
  }
  const sourcePath = getFullPath(item); // uses the `item` you already fetched

  const publishedSegments = mirrorToPublished(sourcePath);

  // TODO should i really be fetching folder before pdf packet generation?
  const publishedFolderId = await ensureFolderPath(
    sharepointDriveId,
    publishedSegments,
    accessToken,
  );

  const { filename, rev } = await nextVersionedFilename(
    sharepointDriveId,
    publishedFolderId,
    "MeetingPacket",
    accessToken,
  );
  const pdfBytes = await buildMergedPacket(
    sharepointSiteId,
    sharepointDriveId,
    folderId as string,
    accessToken,
    {
      departmentName: departmentName,
      packetTitle: "MEETING PACKET",
      // TODO make date look pretty?
      packetSubtitle: `${item.name}-${parentName}`,
      rev,
    },
  );

  const uploaded = await uploadPacketResumable(
    sharepointDriveId,
    publishedFolderId,
    filename,
    pdfBytes,
    accessToken,
  );

  const [updatedPacket] = await db
    .update(MeetingPacket)
    .set({
      publishedFileId: uploaded.id,
      publishedFileUrl: uploaded.webUrl,
      publishedAt: new Date(),
      status: "PUBLISHED",
    })
    .where(eq(MeetingPacket.id, existingPacket.id))
    .returning();

  // Point the calendar event at the newly published packet.
  // Non-fatal: the PDF is already published, so a failure here becomes a warning.
  let calendarWarning: string | undefined;

  if (!updatedPacket.outlookEventId) {
    calendarWarning =
      "Packet published, but no calendar event is linked to it.";
  } else if (!mailboxUserEmail) {
    calendarWarning =
      "Packet published, but the organization has no mailbox configured.";
  } else {
    try {
      await updateEventPacketLink({
        organizationId: organization.id,
        mailboxUserEmail: mailboxUserEmail,
        outlookEventId: updatedPacket.outlookEventId,
        // Pick one (see note below):
        href: `${origin}/org/${organization.slug}/items/${uploaded.id}`,
        // href: uploaded.webUrl,
        label: filename,
      });
    } catch (e) {
      console.error("Packet published but calendar link update failed:", e);
      calendarWarning =
        "Packet was published, but the calendar event link couldn't be updated.";
    }
  }

  return {
    filename,
    webLink: uploaded.webUrl,
    calendarWarning,
  };
}
