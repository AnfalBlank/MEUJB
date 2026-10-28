import { NextResponse } from "next/server";
import { getDriveConfigStatus } from "@/utils/driveClient";

export async function GET() {
  const status = getDriveConfigStatus();

  return NextResponse.json({
    success: true,
    ...status,
    instructions: {
      step1: "Buka Google Cloud Console dan buat Service Account",
      step2: "Aktifkan Google Drive API pada project Anda",
      step3: "Download JSON key dan isi GOOGLE_SERVICE_ACCOUNT_EMAIL serta GOOGLE_PRIVATE_KEY di .env.local",
      step4: "Buat folder di Google Drive dan isi GDRIVE_ROOT_FOLDER_ID dari URL folder",
      step5: "Bagikan (Share) folder Drive tersebut ke email Service Account dengan akses Editor",
    },
  });
}
