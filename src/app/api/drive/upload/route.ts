import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleDriveClient,
  getOrCreateFolder,
  uploadBufferToDrive,
  getDriveConfigStatus,
} from "@/utils/driveClient";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const docType = (formData.get("docType") as string) || "WO";
    const docNumber = (formData.get("docNumber") as string) || "DRAFT";
    const subdiv =
      (formData.get("subdiv") as string) || "Fueling System Engineering";
    const customer = (formData.get("customer") as string) || "Umum";
    const category =
      (formData.get("category") as string) || "Berita_Acara"; // "Berita_Acara" | "Foto_Dokumentasi"
    const year =
      (formData.get("year") as string) || new Date().getFullYear().toString();

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File tidak ditemukan dalam request" },
        { status: 400 }
      );
    }

    const driveClient = getGoogleDriveClient(req.nextUrl.origin);
    const driveStatus = getDriveConfigStatus(req.nextUrl.origin);

    // Jika Google Drive belum dikonfigurasi, gunakan tautan simulasi terstruktur
    if (!driveClient || !driveStatus.configured || !driveStatus.rootFolderId) {
      const sanitizedDoc = docNumber.replace(/[^a-zA-Z0-9_-]/g, "_");
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const simulatedUrl = `https://drive.google.com/file/d/drive_${Date.now()}_${cleanFileName}/view`;

      return NextResponse.json({
        success: true,
        simulated: true,
        fileUrl: simulatedUrl,
        fileName: file.name,
        targetPath: `OPERASIONAL TEKNIK / ${year} / ${subdiv} / [${docType}-${docNumber}] ${customer} / ${category} / ${file.name}`,
        message:
          "Google Drive belum terhubung (OAuth 2.0 / Service Account). URL simulasi telah dibuat.",
      });
    }

    // Jika kredensial Google Drive aktif, lakukan pembuatan folder & upload riil
    const rootFolderId = driveStatus.rootFolderId;

    // 1. Level 1: Tahun (misal: 2026)
    const yearFolderId = await getOrCreateFolder(
      driveClient,
      year,
      rootFolderId
    );

    // 2. Level 2: Sub-Divisi
    const subdivFolderId = await getOrCreateFolder(
      driveClient,
      subdiv,
      yearFolderId
    );

    // 3. Level 3: Folder Proyek misal [WO-WO-EXT-2026-089] PT Pertamina Patra Niaga
    const projectFolderName = `[${docType}-${docNumber}] ${customer}`;
    const projectFolderId = await getOrCreateFolder(
      driveClient,
      projectFolderName,
      subdivFolderId
    );

    // 4. Level 4: Kategori (Berita_Acara atau Foto_Dokumentasi)
    const categoryFolderId = await getOrCreateFolder(
      driveClient,
      category,
      projectFolderId
    );

    // 5. Upload File Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let uploaded: { id: string; webViewLink: string };
    try {
      uploaded = await uploadBufferToDrive(driveClient, {
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        buffer,
        folderId: categoryFolderId,
      });

      return NextResponse.json({
        success: true,
        simulated: false,
        fileId: uploaded.id,
        fileUrl: uploaded.webViewLink,
        fileName: file.name,
        targetPath: `OPERASIONAL TEKNIK / ${year} / ${subdiv} / ${projectFolderName} / ${category} / ${file.name}`,
      });
    } catch (uploadErr: any) {
      if (
        uploadErr.message?.includes("storage quota") ||
        uploadErr.message?.includes("Service Accounts do not have storage quota")
      ) {
        const folderUrl = `https://drive.google.com/drive/folders/${categoryFolderId}`;
        return NextResponse.json({
          success: true,
          simulated: false,
          folderCreated: true,
          fileId: categoryFolderId,
          fileUrl: folderUrl,
          folderUrl,
          fileName: file.name,
          targetPath: `OPERASIONAL TEKNIK / ${year} / ${subdiv} / ${projectFolderName} / ${category}`,
          quotaNotice: true,
          message:
            "Folder proyek berhasil dibuat di Google Drive Anda. Karena akun Gmail personal membatasi kuota Service Account (0 bytes), silakan taruh file langsung ke dalam folder Drive yang telah dibuat, atau gunakan Google Workspace Shared Drive.",
        });
      }
      throw uploadErr;
    }
  } catch (error: any) {
    console.error("Error upload to Google Drive:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mengunggah file ke Google Drive",
      },
      { status: 500 }
    );
  }
}
