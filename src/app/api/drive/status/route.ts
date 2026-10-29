import { NextRequest, NextResponse } from "next/server";
import { getDriveConfigStatus } from "@/utils/driveClient";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const status = getDriveConfigStatus(origin);

  return NextResponse.json({
    success: true,
    ...status,
    instructions: {
      step1: "Buka Google Cloud Console dan buat OAuth 2.0 Client ID (Web Application)",
      step2: `Tambahkan Authorized redirect URI: ${status.redirectUri}`,
      step3: "Salin Client ID dan Client Secret ke form atau .env.local",
      step4: "Klik 'Hubungkan Akun Google Drive' dan beri izin akses",
      step5: "Status aplikasi di Google Console ubah ke 'In Production' agar token permanen",
    },
  });
}
