import { NextResponse } from "next/server";
import { insertAuditLog } from "@/db";
import { getTokenFromRequest, deleteSessionToken, validateSessionToken } from "@/utils/auth";

export async function POST(req: Request) {
  try {
    const token = getTokenFromRequest(req);
    const session = token ? validateSessionToken(token) : null;

    if (token) deleteSessionToken(token);

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Browser";

    if (session) {
      await insertAuditLog({
        userId: session.userId,
        username: session.username,
        userName: session.name,
        userRole: session.role,
        action: "LOGOUT",
        category: "AUTH",
        details: `User ${session.name} (@${session.username}) logout dari sistem`,
        ipAddress: ip,
        userAgent,
      });
    }

    return NextResponse.json({ success: true, message: "Logout berhasil" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
