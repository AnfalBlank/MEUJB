import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getDriveConfigStatus } from "@/utils/driveClient";

function updateEnvKey(content: string, key: string, value: string): string {
  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(content)) {
    return content.replace(regex, `${key}="${value}"`);
  }
  return content.trimEnd() + `\n${key}="${value}"\n`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, clientSecret, refreshToken, rootFolderId } = body;

    const envPath = path.resolve(process.cwd(), ".env.local");
    let content = "";
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, "utf-8");
    }

    if (clientId !== undefined) {
      content = updateEnvKey(content, "GOOGLE_CLIENT_ID", clientId.trim());
      process.env.GOOGLE_CLIENT_ID = clientId.trim();
    }

    if (clientSecret !== undefined) {
      content = updateEnvKey(content, "GOOGLE_CLIENT_SECRET", clientSecret.trim());
      process.env.GOOGLE_CLIENT_SECRET = clientSecret.trim();
    }

    if (refreshToken !== undefined) {
      content = updateEnvKey(content, "GOOGLE_REFRESH_TOKEN", refreshToken.trim());
      process.env.GOOGLE_REFRESH_TOKEN = refreshToken.trim();
    }

    if (rootFolderId !== undefined) {
      content = updateEnvKey(content, "GDRIVE_ROOT_FOLDER_ID", rootFolderId.trim());
      process.env.GDRIVE_ROOT_FOLDER_ID = rootFolderId.trim();
    }

    fs.writeFileSync(envPath, content, "utf-8");

    const status = getDriveConfigStatus(req.nextUrl.origin);

    return NextResponse.json({
      success: true,
      message: "Konfigurasi Google Drive berhasil disimpan ke .env.local",
      status,
    });
  } catch (err: any) {
    console.error("Failed to update Google Drive credentials:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menyimpan konfigurasi" },
      { status: 500 }
    );
  }
}
