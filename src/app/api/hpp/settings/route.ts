import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { postToGAS } from "@/lib/gas-client";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { siklusId, komoditasId, alokasiPersen, markupPersen, marginPersen, hargaJualInput } = body;

    if (!siklusId || !komoditasId) {
      return NextResponse.json({ error: "siklusId dan komoditasId wajib diisi" }, { status: 400 });
    }

    const { userId } = session;

    const payload = {
      hpp_setting_id: crypto.randomUUID(),
      siklus_id: siklusId,
      komoditas_id: komoditasId,
      user_id: userId,
      alokasi_persen: Number(alokasiPersen ?? 0),
      markup_persen: Number(markupPersen ?? 30),
      margin_persen: Number(marginPersen ?? 30),
      harga_jual_input: Number(hargaJualInput ?? 0),
    };

    const res = await postToGAS("saveHPPSettings", payload);

    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: payload });
  } catch (error: any) {
    console.error("POST HPP Settings API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menyimpan pengaturan HPP" },
      { status: 500 }
    );
  }
}
