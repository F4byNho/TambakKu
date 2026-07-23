import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { fetchFromGAS, postToGAS } from "@/lib/gas-client";
import { tambakSchema } from "@/validators/tambak";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { userId, role } = session;
    const { searchParams } = new URL(req.url);
    const anggotaId = searchParams.get("anggotaId") || "";

    const res = await fetchFromGAS<any[]>("getTambak", {
      userId,
      isAdmin: role === "admin" ? "true" : "false",
      anggotaId,
    });
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    
    return NextResponse.json({ data: res.data || [] });
  } catch (error: any) {
    console.error("GET Tambak API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengambil data tambak" },
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
    const result = tambakSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { nama_tambak, anggota_id, lokasi, luas_tambak, status_tambak, keterangan, catatan } = result.data;
    const tambakId = crypto.randomUUID();
    
    const payload = {
      tambak_id: tambakId,
      user_id: session.userId,
      anggota_id,
      nama_tambak,
      lokasi: lokasi || "",
      luas_tambak,
      status_tambak: status_tambak || "Aktif",
      keterangan: keterangan || "",
      catatan: catatan || "",
    };
    
    const res = await postToGAS("createTambak", payload);
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Tambak berhasil dibuat", 
      data: payload 
    });
  } catch (error: any) {
    console.error("POST Tambak API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat tambak" },
      { status: 500 }
    );
  }
}
