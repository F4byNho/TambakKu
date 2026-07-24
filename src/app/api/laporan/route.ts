import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { fetchFromGAS } from "@/lib/gas-client";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const tambakId = searchParams.get("tambakId") || "";
    const siklusId = searchParams.get("siklusId") || "";
    const anggotaId = searchParams.get("anggotaId") || "";
    
    const { userId } = session;
    const res = await fetchFromGAS<any>("getLaporanDataset", {
      userId,
      tambakId,
      siklusId,
      anggotaId,
    });
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    
    return NextResponse.json({ data: res.data });
  } catch (error: any) {
    console.error("GET Laporan API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengambil dataset laporan" },
      { status: 500 }
    );
  }
}

