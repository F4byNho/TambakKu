import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { postToGAS } from "@/lib/gas-client";
import { samplingSchema } from "@/validators/budidaya";

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
    const result = samplingSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const payload = {
      sampling_id: id,
      tanggal_sampling: result.data.tanggal,
      jumlah_udang_sampling: result.data.jumlah_udang,
      berat_total_sampling: result.data.berat_total,
      ...result.data,
    };
    
    const res = await postToGAS("updateSampling", payload);
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, message: "Data sampling berhasil diperbarui" });
  } catch (error: any) {
    console.error("PUT Sampling API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui data sampling" },
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
    
    const res = await postToGAS("deleteSampling", { sampling_id: id });
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, message: "Data sampling berhasil dihapus" });
  } catch (error: any) {
    console.error("DELETE Sampling API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghapus data sampling" },
      { status: 500 }
    );
  }
}
