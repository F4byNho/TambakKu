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
    
    if (!siklusId) {
      return NextResponse.json({ error: "siklusId is required" }, { status: 400 });
    }
    
    const res = await fetchFromGAS<any[]>("getPanen", { siklusId });
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    
    return NextResponse.json({ data: res.data || [] });
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
      ...result.data,
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
