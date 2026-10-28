import { google } from "googleapis";
import { Readable } from "stream";

export interface DriveConfigStatus {
  configured: boolean;
  serviceAccountEmail?: string;
  rootFolderId?: string;
  error?: string;
}

export function getDriveConfigStatus(): DriveConfigStatus {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  const rootId = process.env.GDRIVE_ROOT_FOLDER_ID;

  if (!email || !key || !rootId) {
    return {
      configured: false,
      serviceAccountEmail: email || undefined,
      rootFolderId: rootId || undefined,
      error: "Kredensial Service Account atau Root Folder ID belum dikonfigurasi di .env.local",
    };
  }

  return {
    configured: true,
    serviceAccountEmail: email,
    rootFolderId: rootId,
  };
}

export function getGoogleDriveClient() {
  const status = getDriveConfigStatus();
  if (!status.configured) {
    return null;
  }

  const rawKey = process.env.GOOGLE_PRIVATE_KEY || "";
  const privateKey = rawKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
}

/**
 * Cari atau buat subfolder di dalam folder induk Google Drive
 */
export async function getOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  folderName: string,
  parentId: string
): Promise<string> {
  const cleanName = folderName.replace(/'/g, "\\'");
  const query = `'${parentId}' in parents and name = '${cleanName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  const searchRes = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    spaces: "drive",
  });

  if (searchRes.data.files && searchRes.data.files.length > 0) {
    return searchRes.data.files[0].id!;
  }

  // Buat folder baru jika belum ada
  const createRes = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });

  return createRes.data.id!;
}

/**
 * Unggah file buffer ke Google Drive pada folder tujuan
 */
export async function uploadBufferToDrive(
  drive: ReturnType<typeof google.drive>,
  options: {
    fileName: string;
    mimeType: string;
    buffer: Buffer;
    folderId: string;
  }
): Promise<{ id: string; webViewLink: string }> {
  const stream = new Readable();
  stream.push(options.buffer);
  stream.push(null);

  const fileRes = await drive.files.create({
    requestBody: {
      name: options.fileName,
      parents: [options.folderId],
    },
    media: {
      mimeType: options.mimeType,
      body: stream,
    },
    fields: "id, webViewLink, webContentLink",
  });

  const fileId = fileRes.data.id!;
  const webViewLink =
    fileRes.data.webViewLink ||
    `https://drive.google.com/file/d/${fileId}/view`;

  // Berikan permission view ke anyone agar teknisi/klien bisa membuka link
  try {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });
  } catch (err) {
    // Abaikan jika domain policy melarang public view
    console.warn("Could not set anyone:reader on drive file:", err);
  }

  return {
    id: fileId,
    webViewLink,
  };
}
