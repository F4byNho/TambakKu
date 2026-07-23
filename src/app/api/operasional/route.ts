import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { fetchFromGAS, postToGAS } from "@/lib/gas-client";
import { operasionalSchema } from "@/validators/budidaya";
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
    
    const res = await fetchFromGAS<any[]>("getOperasional", { 
      siklusId,
      komoditasId: komoditasId || "" 
    });
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    const processedData = (res.data || []).map((item) => ({
      ...item,
      tanggal: item.tanggal_operasional || item.tanggal || "",
      nominal: item.deskripsi || item.nominal || 0, // In backend deskripsi stores the nominal due to column mismatch
      keterangan: item.biaya || item.keterangan || "", // In backend biaya stores the keterangan due to column mismatch
    }));
    
    return NextResponse.json({ data: processedData });
  } catch (error: any) {
    console.error("GET Operasional API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengambil data pengeluaran" },
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
    
    const result = operasionalSchema.safeParse(rest);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const operasionalId = crypto.randomUUID();
    const payload = {
      operasional_id: operasionalId,
      siklus_id: siklusId,
      user_id: session.userId,
      tanggal: result.data.tanggal, // Used by createOperasional in GAS
      tanggal_operasional: result.data.tanggal, // Needed for updateRowData
      deskripsi: result.data.nominal, // Hack: GAS expects deskripsi to be nominal based on column order
      biaya: result.data.keterangan, // Hack: GAS expects biaya to be keterangan based on column order
      ...result.data,
    };
    
    const res = await postToGAS("createOperasional", payload);
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Biaya pengeluaran berhasil dicatat", 
      data: payload 
    });
  } catch (error: any) {
    console.error("POST Operasional API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mencatat biaya pengeluaran" },
      { status: 500 }
    );
  }
}
