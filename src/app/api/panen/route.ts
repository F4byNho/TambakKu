import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { fetchFromGAS, postToGAS } from "@/lib/gas-client";
import { panenSchema } from "@/validators/budidaya";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const siklusId = searchParams.get("siklusId");
    const komoditasId = searchParams.get("komoditasId");
    
    if (!siklusId) {
      return NextResponse.json({ error: "siklusId is required" }, { status: 400 });
    }
    
    const res = await fetchFromGAS<any[]>("getPanen", { 
      siklusId,
      komoditasId: komoditasId || ""
    });
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    const processedData = (res.data || []).map((item) => ({
      ...item,
      tanggal: item.tanggal_panen || item.tanggal || "",
    }));
    
    return NextResponse.json({ data: processedData });
  } catch (error: any) {
    console.error("GET Panen API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengambil data panen" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    const { siklusId, ...rest } = body;
    
    if (!siklusId) {
      return NextResponse.json({ error: "siklusId is required" }, { status: 400 });
    }
    
    const result = panenSchema.safeParse(rest);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const panenId = crypto.randomUUID();
    const payload = {
      panen_id: panenId,
      siklus_id: siklusId,
      user_id: session.userId,
      tanggal_panen: result.data.tanggal,
      berat_panen: result.data.berat_panen,
      harga_jual: result.data.harga_jual,
      size: result.data.size ?? 0,
      komoditas_id: result.data.komoditas_id,
      // Calculated fields passed from frontend (may override GAS auto-calculation)
      jumlah_ekor: Number(rest.jumlah_ekor || 0),
      pendapatan: Number(rest.pendapatan || 0),
      sr_percent: Number(rest.sr_percent || 0),
    };
    
    const res = await postToGAS("createPanen", payload);
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Data panen berhasil dicatat", 
      data: payload 
    });
  } catch (error: any) {
    console.error("POST Panen API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mencatat data panen" },
      { status: 500 }
    );
  }
}
