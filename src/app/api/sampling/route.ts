import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { fetchFromGAS, postToGAS } from "@/lib/gas-client";
import { samplingSchema } from "@/validators/budidaya";
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
    
    const res = await fetchFromGAS<any[]>("getSampling", { 
      siklusId,
      komoditasId: komoditasId || ""
    });
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    
    // Kembalikan data beserta ABW dan Size terhitung
    const processedData = (res.data || []).map((item) => {
      const dbAbw = Number(item.abw || 0);
      const dbSize = Number(item.size || 0);
      
      const jumlahUdang = Number(item.jumlah_udang_sampling || item.jumlah_udang || 0);
      const beratTotal = Number(item.berat_total_sampling || item.berat_total || 0);
      const tanggal = item.tanggal_sampling || item.tanggal || "";
      
      const abw = dbAbw > 0 ? dbAbw : (jumlahUdang > 0 ? (beratTotal / jumlahUdang) : 0);
      const size = dbSize > 0 ? dbSize : (abw > 0 ? (1000 / abw) : 0);
      
      return {
        ...item,
        tanggal,
        jumlah_udang: jumlahUdang,
        berat_total: beratTotal,
        abw: Number(abw.toFixed(2)),
        size: Math.round(size),
      };
    });
    
    return NextResponse.json({ data: processedData });
  } catch (error: any) {
    console.error("GET Sampling API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengambil data sampling" },
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
    
    const result = samplingSchema.safeParse(rest);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const samplingId = crypto.randomUUID();
    const payload = {
      sampling_id: samplingId,
      siklus_id: siklusId,
      user_id: session.userId,
      tanggal_sampling: result.data.tanggal,
      jumlah_udang_sampling: result.data.jumlah_udang,
      berat_total_sampling: result.data.berat_total,
      ...result.data,
    };
    
    const res = await postToGAS("createSampling", payload);
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Data sampling/monitoring berhasil dicatat", 
      data: payload 
    });
  } catch (error: any) {
    console.error("POST Sampling API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mencatat data sampling/monitoring" },
      { status: 500 }
    );
  }
}
