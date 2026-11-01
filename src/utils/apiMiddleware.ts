/**
 * API Auth Middleware
 * Gunakan di setiap API route dengan: requireAuth(req) atau requireSuperAdmin(req)
 */
import { NextResponse } from "next/server";
import { getSessionFromRequest, isSuperAdmin, isAdminOrAbove } from "@/utils/auth";
import { insertAuditLog } from "@/db";

type MiddlewareResult =
  | { ok: true; session: NonNullable<ReturnType<typeof getSessionFromRequest>> }
  | { ok: false; response: NextResponse };

/** Requires any authenticated user */
export function requireAuth(req: Request): MiddlewareResult {
  const session = getSessionFromRequest(req);
  if (!session) {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const ua = req.headers.get("user-agent") || "unknown";
    const url = new URL(req.url).pathname;
    insertAuditLog({
      username: "anonymous",
      userName: "Anonymous",
      userRole: "unauthenticated",
      action: "ACCESS_DENIED",
      category: "AUTH",
      details: `Akses ditolak (401) - request tanpa token ke ${req.method} ${url}`,
      ipAddress: ip,
      userAgent: ua,
    }).catch(() => {});
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Sesi tidak valid atau sudah berakhir. Silakan login kembali." },
        { status: 401 }
      ),
    };
  }
  return { ok: true, session };
}

/** Requires admin or superadmin role */
export function requireAdmin(req: Request): MiddlewareResult {
  const auth = requireAuth(req);
  if (!auth.ok) return auth;
  if (!isAdminOrAbove(auth.session)) {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const ua = req.headers.get("user-agent") || "unknown";
    const url = new URL(req.url).pathname;
    insertAuditLog({
      userId: auth.session.userId,
      username: auth.session.username,
      userName: auth.session.name,
      userRole: auth.session.role,
      action: "ACCESS_DENIED",
      category: "AUTH",
      details: `Akses ditolak (403) - role [${auth.session.role}] tidak cukup untuk ${req.method} ${url}`,
      ipAddress: ip,
      userAgent: ua,
    }).catch(() => {});
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Admin atau Superadmin yang diizinkan." },
        { status: 403 }
      ),
    };
  }
  return auth;
}

/** Requires superadmin role */
export function requireSuperAdmin(req: Request): MiddlewareResult {
  const auth = requireAuth(req);
  if (!auth.ok) return auth;
  if (!isSuperAdmin(auth.session)) {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const ua = req.headers.get("user-agent") || "unknown";
    const url = new URL(req.url).pathname;
    insertAuditLog({
      userId: auth.session.userId,
      username: auth.session.username,
      userName: auth.session.name,
      userRole: auth.session.role,
      action: "ACCESS_DENIED",
      category: "AUTH",
      details: `Akses ditolak (403) - role [${auth.session.role}] bukan Superadmin untuk ${req.method} ${url}`,
      ipAddress: ip,
      userAgent: ua,
    }).catch(() => {});
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Superadmin yang diizinkan." },
        { status: 403 }
      ),
    };
  }
  return auth;
}
