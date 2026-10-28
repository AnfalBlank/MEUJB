import { NextResponse } from "next/server";
import { client, ensureTablesAndSeed } from "@/db";

export async function GET() {
  try {
    const start = Date.now();
    await ensureTablesAndSeed();

    const jobsCount = await client.execute("SELECT count(*) as count FROM work_orders");
    const techCount = await client.execute("SELECT count(*) as count FROM technicians");
    const latency = Date.now() - start;

    return NextResponse.json({
      success: true,
      provider: "Turso (LibSQL Cloud)",
      region: "AWS AP-Northeast-1 (Tokyo)",
      databaseUrl: "libsql://internalmesystem-anfal.aws-ap-northeast-1.turso.io",
      latencyMs: latency,
      totalJobs: Number(jobsCount.rows[0]?.count || 0),
      totalTechnicians: Number(techCount.rows[0]?.count || 0),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed connecting to Turso",
      },
      { status: 500 }
    );
  }
}
