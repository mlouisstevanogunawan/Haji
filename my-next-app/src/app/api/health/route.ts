import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "Sistem Manajemen Umroh",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    database: "connected",
    kemenagSync: "active",
  });
}
