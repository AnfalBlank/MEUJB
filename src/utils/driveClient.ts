import { google } from "googleapis";
import { Readable } from "stream";

export type DriveAuthType = "oauth" | "service_account" | "none";

export interface DriveConfigStatus {
  configured: boolean;
  authType: DriveAuthType;
  hasOAuthCredentials: boolean;
  hasRefreshToken: boolean;
  hasServiceAccount: boolean;
  serviceAccountEmail?: string;
  rootFolderId?: string;
  clientIdMasked?: string;
  redirectUri: string;
  error?: string;
}

export function getOAuthRedirectUri(originOverride?: string): string {
  if (originOverride) {
    return `${originOverride.replace(/\/$/, "")}/api/drive/callback`;
  }
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  return "http://localhost:3001/api/drive/callback";
}

export function getOAuth2Client(redirectUriOverride?: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = getOAuthRedirectUri(redirectUriOverride);

  if (!clientId || !clientSecret) {
    return null;
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getDriveConfigStatus(originOverride?: string): DriveConfigStatus {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const saEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const saKey = process.env.GOOGLE_PRIVATE_KEY;
  const rootId = process.env.GDRIVE_ROOT_FOLDER_ID;
  const redirectUri = getOAuthRedirectUri(originOverride);

  const hasOAuthCredentials = Boolean(clientId && clientSecret);
  const hasRefreshToken = Boolean(refreshToken);
  const hasServiceAccount = Boolean(saEmail && saKey);

  let authType: DriveAuthType = "none";
  let configured = false;
  let error: string | undefined = undefined;

  if (hasOAuthCredentials && hasRefreshToken && rootId) {
    authType = "oauth";
    configured = true;
  } else if (hasServiceAccount && rootId) {
    authType = "service_account";
    configured = true;
  } else {
    if (!rootId) {
      error = "GDRIVE_ROOT_FOLDER_ID belum diisi di .env.local";
    } else if (hasOAuthCredentials && !hasRefreshToken) {
      error = "OAuth Client ID & Secret sudah terisi, namun akun Google Drive belum dihubungkan (Refresh Token kosong)";
    } else {
      error = "Kredensial Google Drive (OAuth 2.0 atau Service Account) belum dikonfigurasi di .env.local";
    }
  }

  let clientIdMasked: string | undefined = undefined;
  if (clientId) {
    clientIdMasked =
      clientId.length > 20
        ? `${clientId.substring(0, 8)}...${clientId.substring(clientId.length - 12)}`
        : clientId;
  }

  return {
    configured,
    authType,
    hasOAuthCredentials,
    hasRefreshToken,
    hasServiceAccount,
    serviceAccountEmail: saEmail || undefined,
    rootFolderId: rootId || undefined,
    clientIdMasked,
    redirectUri,
    error,
  };
}

export function getGoogleDriveClient(originOverride?: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  // 1. Prioritaskan OAuth 2.0 (Kuota personal 15GB, bebas limit kuota Service Account)
  if (clientId && clientSecret && refreshToken) {
    const redirectUri = getOAuthRedirectUri(originOverride);
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
    return google.drive({ version: "v3", auth: oauth2Client });
  }

  // 2. Fallback ke Service Account (jika tersedia)
  const saEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const saRawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (saEmail && saRawKey) {
    const privateKey = saRawKey.replace(/\\n/g, "\n");
    const auth = new google.auth.JWT({
      email: saEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/drive"],
    });
    return google.drive({ version: "v3", auth });
  }

  return null;
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
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
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
    supportsAllDrives: true,
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
    supportsAllDrives: true,
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
      supportsAllDrives: true,
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
