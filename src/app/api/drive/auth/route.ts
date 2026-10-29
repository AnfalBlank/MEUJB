import { NextRequest, NextResponse } from "next/server";
import { getOAuth2Client, getOAuthRedirectUri } from "@/utils/driveClient";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const redirectUri = getOAuthRedirectUri(origin);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response(
      `<!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>OAuth 2.0 Belum Dikonfigurasi - ME-IT</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; max-width: 560px; width: 100%; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
            .badge { display: inline-block; padding: 4px 10px; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #f87171; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-bottom: 16px; }
            h1 { font-size: 20px; font-weight: 700; margin: 0 0 12px; color: #ffffff; }
            p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px; }
            .code-box { background: #090d16; border: 1px solid #1e293b; border-radius: 8px; padding: 14px; font-family: monospace; font-size: 12px; color: #38bdf8; overflow-x: auto; margin-bottom: 24px; }
            .btn { display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 13px; padding: 10px 20px; border-radius: 8px; transition: background 0.2s; }
            .btn:hover { background: #1d4ed8; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">Kredensial Belum Lengkap</span>
            <h1>GOOGLE_CLIENT_ID atau SECRET Kosong</h1>
            <p>Untuk menghubungkan akun Google Drive dengan OAuth 2.0 (15GB gratis), masukkan <strong>GOOGLE_CLIENT_ID</strong> dan <strong>GOOGLE_CLIENT_SECRET</strong> ke berkas <code>.env.local</code> atau lewat menu Panduan Google Drive.</p>
            <div class="code-box">
              GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"<br />
              GOOGLE_CLIENT_SECRET="GOCSPX-xxx"<br />
              GOOGLE_REDIRECT_URI="${redirectUri}"
            </div>
            <a href="/" class="btn">Kembali ke Aplikasi</a>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 }
    );
  }

  const oauth2Client = getOAuth2Client(origin);
  if (!oauth2Client) {
    return NextResponse.json({ error: "Gagal membuat klien OAuth 2.0" }, { status: 500 });
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive"],
    redirect_uri: redirectUri,
  });

  return NextResponse.redirect(authUrl);
}
