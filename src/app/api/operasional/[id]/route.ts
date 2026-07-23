import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { postToGAS } from "@/lib/gas-client";
import { operasionalSchema } from "@/validators/budidaya";

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
    const result = operasionalSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const payload = {
      operasional_id: id,
      tanggal_operasional: result.data.tanggal,
      deskripsi: result.data.nominal,
      biaya: result.data.keterangan,
      ...result.data,
    };
    
    const res = await postToGAS("updateOperasional", payload);
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, message: "Biaya operasional berhasil diperbarui" });
  } catch (error: any) {
    console.error("PUT Operasional API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui data operasional" },
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
    
    const res = await postToGAS("deleteOperasional", { operasional_id: id });
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, message: "Biaya operasional berhasil dihapus" });
  } catch (error: any) {
    console.error("DELETE Operasional API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghapus data operasional" },
      { status: 500 }
    );
  }
}
