import { NextResponse } from "next/server";
import { requireAuth } from "@/utils/apiMiddleware";
import { client } from "@/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const { status } = await req.json();

    if (!["Done", "Pending", "Hold", "Cancel"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const now = new Date().toISOString();
    await client.execute({
      sql: "UPDATE work_orders SET status = ?, updated_at = ? WHERE id = ?",
      args: [status, now, id],
    });

    return NextResponse.json({ success: true, message: `Status updated to ${status}` });
  } catch (error: any) {
    console.error("API PATCH /api/jobs/[id]/status error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed updating status" },
      { status: 500 }
    );
  }
}
