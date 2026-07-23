import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { postToGAS } from "@/lib/gas-client";
import { anggotaSchema } from "@/validators/anggota";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const anggotaId = resolvedParams.id;
    const body = await req.json();
    const result = anggotaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { userId } = session;

    const res = await postToGAS("updateAnggota", {
      anggota_id: anggotaId,
      user_id: userId,
      ...result.data,
    });

    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      message: "Data anggota Pokdakan berhasil diperbarui",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui data anggota" },
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

    const resolvedParams = await params;
    const anggotaId = resolvedParams.id;

    const res = await postToGAS("deleteAnggota", {
      anggota_id: anggotaId,
    });

    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      message: "Anggota Pokdakan berhasil dihapus",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal menghapus anggota" },
      { status: 500 }
    );
  }
}
