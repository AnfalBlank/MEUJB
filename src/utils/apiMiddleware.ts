/**
 * API Auth Middleware
 * Gunakan di setiap API route dengan: requireAuth(req) atau requireSuperAdmin(req)
 */
import { NextResponse } from "next/server";
import { getSessionFromRequest, isSuperAdmin, isAdminOrAbove } from "@/utils/auth";

type MiddlewareResult =
  | { ok: true; session: NonNullable<ReturnType<typeof getSessionFromRequest>> }
  | { ok: false; response: NextResponse };

/** Requires any authenticated user */
export function requireAuth(req: Request): MiddlewareResult {
  const session = getSessionFromRequest(req);
  if (!session) {
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
