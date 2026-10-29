import { NextResponse } from "next/server";
import { insertAuditLog } from "@/db";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = String(body.username || "anonymous");
    const name = String(body.name || username);
    const role = String(body.role || "user");

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Browser";

    await insertAuditLog({
      username,
      userName: name,
      userRole: role,
      action: "LOGOUT",
      category: "AUTH",
      details: `User ${name} (@${username}) telah logout dari sistem`,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({ success: true, message: "Logout logged successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
