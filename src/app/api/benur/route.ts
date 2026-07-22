import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { fetchFromGAS, postToGAS } from "@/lib/gas-client";
import { benurSchema } from "@/validators/budidaya";
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
    
    const res = await fetchFromGAS<any[]>("getBenur", { 
      siklusId,
      komoditasId: komoditasId || "" 
    });
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    
    return NextResponse.json({ data: res.data || [] });
  } catch (error: any) {
    console.error("GET Benur API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengambil data tebar bibit" },
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
    
    const result = benurSchema.safeParse(rest);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const benurId = crypto.randomUUID();
    const payload = {
      benur_id: benurId,
      siklus_id: siklusId,
      user_id: session.userId,
      ...result.data,
    };
    
    const res = await postToGAS("createBenur", payload);
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Data penebaran/penanaman berhasil dicatat", 
      data: payload 
    });
  } catch (error: any) {
    console.error("POST Benur API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mencatat data penebaran/penanaman" },
      { status: 500 }
    );
  }
}
