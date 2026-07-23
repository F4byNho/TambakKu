import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { fetchFromGAS } from "@/lib/gas-client";

// Keywords to identify labor (TK) costs from the kategori field
const TK_KEYWORDS = ["tenaga kerja", "upah", "gaji", "honor", "honorarium", " tk", "pekerja", "buruh"];

function isTKCategory(kategori: string): boolean {
  const k = (kategori || "").toLowerCase();
  return TK_KEYWORDS.some((kw) => k.includes(kw));
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const siklusId = searchParams.get("siklusId") || "";

    if (!siklusId) {
      return NextResponse.json({ error: "siklusId wajib diisi" }, { status: 400 });
    }

    const { userId } = session;

    // Ambil semua data sekaligus dari GAS
    const res = await fetchFromGAS<any>("getHPPData", { userId, siklusId });

    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    const { tambak, siklus, komoditas, benur, operasional, panen, hppSettings } = res.data;

    // Biaya Bersama (operasional tanpa komoditas_id)
    const opsumum = (operasional as any[]).filter(
      (o) => !o.komoditas_id || String(o.komoditas_id).trim() === ""
    );
    const biayaUmumBersama = opsumum
      .filter((o) => !isTKCategory(o.kategori))
      .reduce((s: number, o: any) => s + Number(o.nominal || 0), 0);
    const tkUmumBersama = opsumum
      .filter((o) => isTKCategory(o.kategori))
      .reduce((s: number, o: any) => s + Number(o.nominal || 0), 0);
    const totalBiayaBersama = biayaUmumBersama + tkUmumBersama;

    // Hitung HPP per komoditas
    const komoditasList = komoditas as any[];
    const defaultAlokasi =
      komoditasList.length > 0
        ? Math.round((100 / komoditasList.length) * 10) / 10
        : 0;

    const hppPerKomoditas = komoditasList.map((k: any) => {
      const komoditasId = k.komoditas_id;

      // Cari setting HPP tersimpan untuk komoditas ini
      const savedSetting = (hppSettings as any[]).find(
        (h) => h.komoditas_id === komoditasId
      );

      const alokasiPersen = Number(savedSetting?.alokasi_persen || defaultAlokasi);
      const markupPersen = Number(savedSetting?.markup_persen || 30);
      const marginPersen = Number(savedSetting?.margin_persen || 30);
      const hargaJualInput = Number(savedSetting?.harga_jual_input || 0);

      // Biaya Benur untuk komoditas ini
      const biayaBenur = (benur as any[])
        .filter((b) => b.komoditas_id === komoditasId)
        .reduce((s: number, b: any) => s + Number(b.total_harga || 0), 0);

      // Biaya Operasional Langsung (non-TK) untuk komoditas ini
      const opsLangsung = (operasional as any[]).filter(
        (o) => o.komoditas_id === komoditasId
      );
      const biayaLangsung = opsLangsung
        .filter((o) => !isTKCategory(o.kategori))
        .reduce((s: number, o: any) => s + Number(o.nominal || 0), 0);

      // Biaya TK Langsung untuk komoditas ini
      const biayaTKLangsung = opsLangsung
        .filter((o) => isTKCategory(o.kategori))
        .reduce((s: number, o: any) => s + Number(o.nominal || 0), 0);

      // Alokasi biaya bersama
      const biayaBersamaTeralokasi = totalBiayaBersama * (alokasiPersen / 100);

      // Total Biaya Produksi
      const totalBiayaProduksi =
        biayaBenur + biayaLangsung + biayaTKLangsung + biayaBersamaTeralokasi;

      // Hasil Panen
      const panenKomoditas = (panen as any[]).filter(
        (p) => p.komoditas_id === komoditasId
      );
      const totalPanen = panenKomoditas.reduce(
        (s: number, p: any) => s + Number(p.berat_panen || 0),
        0
      );
      const totalPendapatan = panenKomoditas.reduce(
        (s: number, p: any) => s + Number(p.pendapatan || 0),
        0
      );

      // HPP per kg
      const hppPerKg = totalPanen > 0 ? totalBiayaProduksi / totalPanen : 0;

      // Kalkulator Harga Jual
      const hargaJualMarkup = hppPerKg * (1 + markupPersen / 100);
      const hargaJualMargin =
        marginPersen < 100 ? hppPerKg / (1 - marginPersen / 100) : 0;

      // Margin & Laba dari Harga Jual Aktual (input manual)
      const marginPerKg = hargaJualInput > 0 ? hargaJualInput - hppPerKg : 0;
      const marginPersen_aktual =
        hargaJualInput > 0 ? (marginPerKg / hargaJualInput) * 100 : 0;
      const totalPendapatanAktual =
        hargaJualInput > 0 ? totalPanen * hargaJualInput : totalPendapatan;
      const labaBersih = totalPendapatanAktual - totalBiayaProduksi;

      return {
        komoditas_id: komoditasId,
        nama_komoditas: k.nama_komoditas,
        jenis_komoditas: k.jenis_komoditas,
        status: k.status,
        // Settings
        alokasiPersen,
        markupPersen,
        marginPersen,
        hargaJualInput,
        // Bagian 1: Biaya Produksi
        biayaBenur,
        biayaLangsung,
        biayaTKLangsung,
        biayaUmumBersama,
        tkUmumBersama,
        totalBiayaBersama,
        biayaBersamaTeralokasi,
        totalBiayaProduksi,
        // Bagian 2: Hasil Panen & HPP
        totalPanen,
        hppPerKg,
        // Bagian 3: Kalkulator
        hargaJualMarkup,
        hargaJualMargin,
        // Bagian 4: Margin & Laba
        marginPerKg,
        marginPersen_aktual,
        totalPendapatan: totalPendapatanAktual,
        labaBersih,
      };
    });

    // Rekap Tambak
    const totalModalTambak = hppPerKomoditas.reduce(
      (s, k) => s + k.totalBiayaProduksi,
      0
    );
    const totalPendapatanTambak = hppPerKomoditas.reduce(
      (s, k) => s + k.totalPendapatan,
      0
    );
    const totalLabaTambak = hppPerKomoditas.reduce(
      (s, k) => s + k.labaBersih,
      0
    );
    const totalProduksiTambak = hppPerKomoditas.reduce(
      (s, k) => s + k.totalPanen,
      0
    );

    return NextResponse.json({
      data: {
        tambak,
        siklus,
        hppPerKomoditas,
        rekapTambak: {
          totalModalTambak,
          totalPendapatanTambak,
          totalLabaTambak,
          totalProduksiTambak,
        },
        // Raw data for reference
        biayaUmumBersama,
        tkUmumBersama,
        totalBiayaBersama,
      },
    });
  } catch (error: any) {
    console.error("GET HPP API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengambil data HPP" },
      { status: 500 }
    );
  }
}
