import { NextRequest, NextResponse } from "next/server";
import { getOAuth2Client, getOAuthRedirectUri } from "@/utils/driveClient";
import fs from "fs";
import path from "path";

function updateEnvFile(key: string, value: string) {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    let content = "";
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, "utf-8");
    }

    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(content)) {
      content = content.replace(regex, `${key}="${value}"`);
    } else {
      content = content.trimEnd() + `\n${key}="${value}"\n`;
    }

    fs.writeFileSync(envPath, content, "utf-8");
    process.env[key] = value;
    return true;
  } catch (err) {
    console.error(`Failed to update ${key} in .env.local:`, err);
    return false;
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const origin = req.nextUrl.origin;
  const redirectUri = getOAuthRedirectUri(origin);

  if (errorParam) {
    return new Response(
      `<!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>Otorisasi Ditolak - Google Drive</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; max-width: 540px; width: 100%; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); text-align: center; }
            .badge { display: inline-block; padding: 4px 12px; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #f87171; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-bottom: 16px; }
            h1 { font-size: 20px; font-weight: 700; margin: 0 0 12px; color: #ffffff; }
            p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px; }
            .btn { display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 13px; padding: 10px 24px; border-radius: 8px; transition: background 0.2s; }
            .btn:hover { background: #1d4ed8; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">Otorisasi Dibatalkan</span>
            <h1>Akses Google Drive Ditolak</h1>
            <p>Anda membatalkan otorisasi atau Google mengembalikan kesalahan: <code>${errorParam}</code>. Silakan coba kembali jika ingin menghubungkan akun Google Drive.</p>
            <a href="/" class="btn">Kembali ke Aplikasi</a>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json({ error: "Code otorisasi tidak ditemukan" }, { status: 400 });
  }

  const oauth2Client = getOAuth2Client(origin);
  if (!oauth2Client) {
    return NextResponse.json(
      { error: "Kredensial OAuth 2.0 (Client ID / Secret) belum diatur di .env.local" },
      { status: 400 }
    );
  }

  try {
    const { tokens } = await oauth2Client.getToken({
      code,
      redirect_uri: redirectUri,
    });

    const refreshToken = tokens.refresh_token;

    let savedToEnv = false;
    if (refreshToken) {
      savedToEnv = updateEnvFile("GOOGLE_REFRESH_TOKEN", refreshToken);
      updateEnvFile("GOOGLE_REDIRECT_URI", redirectUri);
    }

    const tokenDisplay = refreshToken || "(Refresh Token tidak dikembalikan karena akun sudah pernah diizinkan sebelumnya. Cabut akses di myaccount.google.com/permissions lalu otorisasi ulang untuk mendapatkan token baru)";

    return new Response(
      `<!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>Google Drive Berhasil Terhubung - ME-IT</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b1120; color: #f8fafc; padding: 40px 20px; margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; max-width: 600px; width: 100%; padding: 36px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
            .header-flex { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
            .icon-circle { width: 44px; height: 44px; border-radius: 12px; background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; display: flex; align-items: center; justify-content: center; color: #34d399; font-size: 22px; flex-shrink: 0; }
            h1 { font-size: 20px; font-weight: 700; margin: 0; color: #ffffff; }
            .sub { font-size: 12px; color: #94a3b8; margin-top: 2px; }
            .alert-box { background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; font-size: 13px; color: #a7f3d0; line-height: 1.5; }
            .token-container { background: #090d16; border: 1px solid #1e293b; border-radius: 10px; padding: 14px; margin-bottom: 20px; }
            .token-label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px; margin-bottom: 6px; display: block; }
            .token-code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #38bdf8; word-break: break-all; line-height: 1.5; }
            .info-box { background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 10px; padding: 14px; margin-bottom: 24px; font-size: 12px; color: #bfdbfe; line-height: 1.6; }
            .actions { display: flex; gap: 12px; flex-wrap: wrap; }
            .btn-primary { background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 13px; padding: 10px 22px; border-radius: 8px; transition: background 0.2s; display: inline-flex; align-items: center; gap: 6px; }
            .btn-primary:hover { background: #1d4ed8; }
            .btn-secondary { background: #334155; color: #f1f5f9; text-decoration: none; font-weight: 600; font-size: 13px; padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; transition: background 0.2s; }
            .btn-secondary:hover { background: #475569; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header-flex">
              <div class="icon-circle">✓</div>
              <div>
                <h1>Koneksi Google Drive Berhasil!</h1>
                <div class="sub">OAuth 2.0 Offline Access Aktif (Kuota Personal 15 GB)</div>
              </div>
            </div>

            <div class="alert-box">
              <strong>${savedToEnv ? "✓ Otomatis Tersimpan!" : "Catatan:"}</strong>
              ${
                savedToEnv
                  ? "Refresh Token telah otomatis disimpan ke file <code>.env.local</code>. Backend kini dapat mengunggah file ke Google Drive secara otomatis di latar belakang."
                  : "Silakan salin Refresh Token di bawah ini dan masukkan ke <code>.env.local</code> secara manual."
              }
            </div>

            <div class="token-container">
              <span class="token-label">Google Refresh Token</span>
              <div class="token-code" id="tokenText">${tokenDisplay}</div>
            </div>

            <div class="info-box">
              <strong>💡 Catatan Masa Berlaku Token:</strong><br />
              Pastikan status aplikasi di Google Cloud Console &gt; <em>OAuth consent screen</em> sudah diubah ke <strong>"In Production" (Publish App)</strong> agar Refresh Token ini permanen dan tidak kedaluwarsa setelah 7 hari.
            </div>

            <div class="actions">
              <a href="/" class="btn-primary">Kembali ke Dashboard ME-IT</a>
              <button class="btn-secondary" onclick="copyToken()">Salin Token</button>
            </div>
          </div>

          <script>
            function copyToken() {
              const text = document.getElementById("tokenText").innerText;
              navigator.clipboard.writeText(text).then(() => {
                alert("Refresh Token berhasil disalin ke clipboard!");
              });
            }
          </script>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (error: any) {
    console.error("Error exchanging OAuth code for tokens:", error);
    return new Response(
      `<!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>Gagal Menukarkan Token - Google Drive</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; max-width: 560px; width: 100%; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
            .badge { display: inline-block; padding: 4px 10px; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #f87171; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-bottom: 16px; }
            h1 { font-size: 20px; font-weight: 700; margin: 0 0 12px; color: #ffffff; }
            p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px; }
            .err-box { background: #090d16; border: 1px solid #ef4444; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 12px; color: #fca5a5; overflow-x: auto; margin-bottom: 24px; }
            .btn { display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 13px; padding: 10px 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">Kesalahan Otorisasi</span>
            <h1>Gagal Menukarkan Authorization Code</h1>
            <p>Terjadi kesalahan saat meminta token ke server Google:</p>
            <div class="err-box">${error.message || String(error)}</div>
            <a href="/" class="btn">Kembali ke Aplikasi</a>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 500 }
    );
  }
}
