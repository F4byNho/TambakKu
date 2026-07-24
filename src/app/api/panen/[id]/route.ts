import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { postToGAS } from "@/lib/gas-client";
import { panenSchema } from "@/validators/budidaya";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = await params;
    const body = await req.json();
    const result = panenSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const payload = {
      panen_id: id,
      tanggal_panen: result.data.tanggal,
      berat_panen: result.data.berat_panen,
      harga_jual: result.data.harga_jual,
      size: result.data.size ?? 0,
      komoditas_id: result.data.komoditas_id,
      jumlah_ekor: Number(body.jumlah_ekor || 0),
      pendapatan: Number(body.pendapatan || 0),
      sr_percent: Number(body.sr_percent || 0),
    };
    
    const res = await postToGAS("updatePanen", payload);
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, message: "Data panen berhasil diperbarui" });
  } catch (error: any) {
    console.error("PUT Panen API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui data panen" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = await params;
    
    const res = await postToGAS("deletePanen", { panen_id: id });
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, message: "Data panen berhasil dihapus" });
  } catch (error: any) {
    console.error("DELETE Panen API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghapus data panen" },
      { status: 500 }
    );
  }
}
