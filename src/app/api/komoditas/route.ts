import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { fetchFromGAS, postToGAS } from "@/lib/gas-client";
import { komoditasSchema } from "@/validators/komoditas";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siklusId = searchParams.get("siklusId");

    if (!siklusId) {
      return NextResponse.json({ error: "Parameter siklusId wajib disertakan" }, { status: 400 });
    }

    const response = await fetchFromGAS("getKomoditas", {
      userId: user.userId,
      siklusId,
      isAdmin: user.role === "admin" ? "true" : "false"
    });

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siklusId = searchParams.get("siklusId");

    if (!siklusId) {
      return NextResponse.json({ error: "Parameter siklusId wajib disertakan" }, { status: 400 });
    }

    const body = await request.json();
    const result = komoditasSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const newKomoditas = {
      komoditas_id: `komoditas-${crypto.randomUUID()}`,
      siklus_id: siklusId,
      user_id: user.userId,
      ...result.data
    };

    const response = await postToGAS("createKomoditas", newKomoditas);
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
