import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ success: true, message: "Berhasil logout" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal melakukan logout" },
      { status: 500 }
    );
  }
}
