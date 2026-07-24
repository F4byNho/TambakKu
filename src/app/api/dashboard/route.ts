import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { fetchFromGAS } from "@/lib/gas-client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { userId } = session;
    const { searchParams } = new URL(req.url);
    const tambakId = searchParams.get("tambakId") || "";
    const anggotaId = searchParams.get("anggotaId") || "";

    const params: Record<string, string> = { userId };
    if (tambakId) params.tambakId = tambakId;
    if (anggotaId) params.anggotaId = anggotaId;

    const res = await fetchFromGAS<any>("getDashboardData", params);
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    
    return NextResponse.json(res.data);
  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
