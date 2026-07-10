import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { postToGAS } from "@/lib/gas-client";
import { benurSchema } from "@/validators/budidaya";

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
    const result = benurSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const payload = {
      benur_id: id,
      ...result.data,
    };
    
    const res = await postToGAS("updateBenur", payload);
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, message: "Penebaran benur berhasil diperbarui" });
  } catch (error: any) {
    console.error("PUT Benur API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui data benur" },
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
    
    const res = await postToGAS("deleteBenur", { benur_id: id });
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, message: "Penebaran benur berhasil dihapus" });
  } catch (error: any) {
    console.error("DELETE Benur API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghapus data benur" },
      { status: 500 }
    );
  }
}
