import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { fetchFromGAS, postToGAS } from "@/lib/gas-client";
import { siklusSchema } from "@/validators/siklus";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const tambakId = searchParams.get("tambakId") || "";
    
    const { userId, role } = session;
    const res = await fetchFromGAS<any[]>("getSiklus", {
      userId,
      tambakId,
      isAdmin: role === "admin" ? "true" : "false",
    });
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    
    return NextResponse.json({ data: res.data || [] });
  } catch (error: any) {
    console.error("GET Siklus API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengambil data siklus" },
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
    const result = siklusSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { tambak_id, nomor_siklus, tanggal_mulai } = result.data;
    const siklusId = crypto.randomUUID();
    
    const payload = {
      siklus_id: siklusId,
      tambak_id,
      user_id: session.userId,
      nomor_siklus,
      tanggal_mulai,
    };
    
    const res = await postToGAS("createSiklus", payload);
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Siklus berhasil dimulai", 
      data: payload 
    });
  } catch (error: any) {
    console.error("POST Siklus API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat siklus" },
      { status: 500 }
    );
  }
}
