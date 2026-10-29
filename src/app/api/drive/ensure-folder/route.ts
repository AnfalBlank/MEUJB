import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleDriveClient,
  getOrCreateFolder,
  getDriveConfigStatus,
} from "@/utils/driveClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      year = new Date().getFullYear().toString(),
      subdiv = "Fueling System Engineering",
      docType = "WO",
      docNumber = "DRAFT",
      customer = "Umum",
    } = body;

    const driveClient = getGoogleDriveClient(req.nextUrl.origin);
    const driveStatus = getDriveConfigStatus(req.nextUrl.origin);

    if (!driveClient || !driveStatus.configured || !driveStatus.rootFolderId) {
      return NextResponse.json({
        success: false,
        error: "Google Drive API belum dikonfigurasi di .env.local",
      });
    }

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

    // 3. Level 3: Proyek
    const projectFolderName = `[${docType}-${docNumber}] ${customer}`;
    const projectFolderId = await getOrCreateFolder(
      driveClient,
      projectFolderName,
      subdivFolderId
    );

    // 4. Sub-folder Berita Acara & Foto Dokumentasi
    const baFolderId = await getOrCreateFolder(
      driveClient,
      "Berita_Acara",
      projectFolderId
    );

    const fotoFolderId = await getOrCreateFolder(
      driveClient,
      "Foto_Dokumentasi",
      projectFolderId
    );

    const projectFolderUrl = `https://drive.google.com/drive/folders/${projectFolderId}`;
    const baFolderUrl = `https://drive.google.com/drive/folders/${baFolderId}`;
    const fotoFolderUrl = `https://drive.google.com/drive/folders/${fotoFolderId}`;

    return NextResponse.json({
      success: true,
      projectFolderId,
      projectFolderUrl,
      baFolderUrl,
      fotoFolderUrl,
      targetPath: `OPERASIONAL TEKNIK / ${year} / ${subdiv} / ${projectFolderName}`,
    });
  } catch (error: any) {
    console.error("Error creating folder in Google Drive:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal membuat folder di Google Drive",
      },
      { status: 500 }
    );
  }
}
