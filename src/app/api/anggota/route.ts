import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { fetchFromGAS, postToGAS } from "@/lib/gas-client";
import { anggotaSchema } from "@/validators/anggota";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = session;
    const res = await fetchFromGAS<any[]>("getAnggota", { userId });

    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ data: res.data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal mengambil data anggota Pokdakan" },
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
    const result = anggotaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { userId } = session;
    const anggotaId = `ang-${Date.now()}`;

    const res = await postToGAS("createAnggota", {
      anggota_id: anggotaId,
      user_id: userId,
      ...result.data,
    });

    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Anggota Pokdakan berhasil ditambahkan", data: { anggota_id: anggotaId, ...result.data } },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal membuat anggota baru" },
      { status: 500 }
    );
  }
}
