"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Download, 
  Search, 
  Loader2, 
  Calendar, 
  Database, 
  Activity,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatIDR, formatNumber, formatDate } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface TambakItem {
  tambak_id: string;
  nama_tambak: string;
  lokasi: string;
  luas_tambak: number;
}

interface SiklusItem {
  siklus_id: string;
  tambak_id: string;
  nomor_siklus: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: string;
}

interface LaporanDataset {
  tambaks: TambakItem[];
  siklus: SiklusItem[];
  komoditas: any[];
  benur: any[];
  operasional: any[];
  sampling: any[];
  panen: any[];
}

export default function LaporanPage() {
  const [tambaks, setTambaks] = useState<TambakItem[]>([]);
  const [cycles, setCycles] = useState<SiklusItem[]>([]);
  const [filteredCycles, setFilteredCycles] = useState<SiklusItem[]>([]);
  
  // Filter States
  const [selectedTambakId, setSelectedTambakId] = useState("all");
  const [selectedSiklusId, setSelectedSiklusId] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchLoading, setIsFetchLoading] = useState(true);
  const [reportData, setReportData] = useState<LaporanDataset | null>(null);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    if (selectedTambakId === "all") {
      setFilteredCycles([]);
      setSelectedSiklusId("all");
    } else {
      const matchCycles = cycles.filter((c) => c.tambak_id === selectedTambakId);
      setFilteredCycles(matchCycles);
      setSelectedSiklusId("all");
    }
  }, [selectedTambakId, cycles]);

  const fetchFilterOptions = async () => {
    setIsFetchLoading(true);
    try {
      const [resTambak, resSiklus] = await Promise.all([
        fetch("/api/tambak"),
        fetch("/api/siklus"),
      ]);
      const jsonTambak = await resTambak.json();
      const jsonSiklus = await resSiklus.json();

      setTambaks(jsonTambak.data || []);
      setCycles(jsonSiklus.data || []);
    } catch (err: any) {
      toast.error("Gagal memuat filter opsi");
    } finally {
      setIsFetchLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (selectedTambakId !== "all") query.append("tambakId", selectedTambakId);
      if (selectedSiklusId !== "all") query.append("siklusId", selectedSiklusId);

      const res = await fetch(`/api/laporan?${query.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data laporan");
      const json = await res.json();
      
      let dataset: LaporanDataset = json.data || {
        tambaks: [],
        siklus: [],
        komoditas: [],
        benur: [],
        operasional: [],
        sampling: [],
        panen: [],
      };

      // Filter tanggal di sisi klien (jika diisi)
      if (startDate) {
        const start = new Date(startDate);
        dataset.benur = dataset.benur.filter(b => new Date(b.tanggal_tebar || b.tanggal) >= start);
        dataset.operasional = dataset.operasional.filter(o => new Date(o.tanggal || o.tanggal_operasional) >= start);
        dataset.sampling = dataset.sampling.filter(s => new Date(s.tanggal_sampling || s.tanggal) >= start);
        dataset.panen = dataset.panen.filter(p => new Date(p.tanggal_panen || p.tanggal) >= start);
      }
      if (endDate) {
        const end = new Date(endDate);
        dataset.benur = dataset.benur.filter(b => new Date(b.tanggal_tebar || b.tanggal) <= end);
        dataset.operasional = dataset.operasional.filter(o => new Date(o.tanggal || o.tanggal_operasional) <= end);
        dataset.sampling = dataset.sampling.filter(s => new Date(s.tanggal_sampling || s.tanggal) <= end);
        dataset.panen = dataset.panen.filter(p => new Date(p.tanggal_panen || p.tanggal) <= end);
      }

      setReportData(dataset);
      toast.success("Laporan berhasil dimuat! Siap diunduh.");
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat laporan");
    } finally {
      setIsLoading(false);
    }
  };

  const getTambakName = (id: string, dataset = reportData) => {
    return dataset?.tambaks.find((t) => t.tambak_id === id)?.nama_tambak || "Kolam";
  };

  const getKomoditasName = (kId: string, dataset = reportData) => {
    if (!kId) return "Seluruh Tambak";
    return dataset?.komoditas.find((k) => k.komoditas_id === kId)?.nama_komoditas || "Udang Vaname";
  };

  // --- EXPORT TO EXCEL ---
  const handleExportExcel = () => {
    if (!reportData) return;

    try {
      const wb = XLSX.utils.book_new();

      // 1. Sheet Ringkasan Siklus
      const sheetSiklusData = reportData.siklus.map((s) => {
        const benurCost = reportData.benur.filter(b => b.siklus_id === s.siklus_id).reduce((sum, item) => sum + Number(item.total_harga || 0), 0);
        const opsCost = reportData.operasional.filter(o => o.siklus_id === s.siklus_id).reduce((sum, item) => sum + Number(item.nominal || 0), 0);
        const revenue = reportData.panen.filter(p => p.siklus_id === s.siklus_id).reduce((sum, item) => sum + Number(item.pendapatan || 0), 0);
        const sKomoditas = reportData.komoditas.filter(k => k.siklus_id === s.siklus_id).map(k => k.nama_komoditas).join(", ");
        
        return {
          "Kolam Tambak": getTambakName(s.tambak_id),
          "Siklus Ke-": s.nomor_siklus,
          "Daftar Komoditas": sKomoditas || "Udang Vaname",
          "Tanggal Mulai": formatDate(s.tanggal_mulai),
          "Tanggal Selesai": formatDate(s.tanggal_selesai),
          "Status": s.status,
          "Biaya Bibit (Rp)": benurCost,
          "Biaya Ops (Rp)": opsCost,
          "Total Modal (Rp)": benurCost + opsCost,
          "Total Pendapatan (Rp)": revenue,
          "Laba Bersih (Rp)": revenue - (benurCost + opsCost),
        };
      });
      const wsSiklus = XLSX.utils.json_to_sheet(sheetSiklusData);
      XLSX.utils.book_append_sheet(wb, wsSiklus, "Ringkasan Siklus");

      // 2. Sheet Benur / Bibit
      const sheetBenurData = reportData.benur.map((b) => ({
        "Kolam Tambak": getTambakName(reportData.siklus.find(s => s.siklus_id === b.siklus_id)?.tambak_id || ""),
        "Komoditas": getKomoditasName(b.komoditas_id),
        "Tanggal Tebar/Tanam": formatDate(b.tanggal_tebar || b.tanggal),
        "Varietas / Jenis": b.jenis_udang,
        "Ukuran / Metode": b.ukuran_PL,
        "Jumlah / Berat": b.jumlah_benur,
        "Harga Satuan (Rp)": b.harga_per_ekor,
        "Total Harga (Rp)": b.total_harga,
      }));
      const wsBenur = XLSX.utils.json_to_sheet(sheetBenurData);
      XLSX.utils.book_append_sheet(wb, wsBenur, "Log Penebaran Bibit");

      // 3. Sheet Operasional
      const sheetOpsData = reportData.operasional.map((o) => ({
        "Komoditas": getKomoditasName(o.komoditas_id),
        "Tanggal": formatDate(o.tanggal || o.tanggal_operasional),
        "Kategori": o.kategori,
        "Nominal (Rp)": o.nominal,
        "Keterangan": o.keterangan || "-",
      }));
      const wsOps = XLSX.utils.json_to_sheet(sheetOpsData);
      XLSX.utils.book_append_sheet(wb, wsOps, "Operasional");

      // 4. Sheet Sampling
      const sheetSamplingData = reportData.sampling.map((s) => ({
        "Komoditas": getKomoditasName(s.komoditas_id),
        "Tanggal": formatDate(s.tanggal_sampling || s.tanggal),
        "Jumlah Sample (ekor)": s.jumlah_udang_sampling || s.jumlah_udang || "-",
        "Berat Total (gram)": s.berat_total_sampling || s.berat_total,
        "ABW / Berat Rata-rata (gram)": s.abw,
        "Size (khusus udang)": s.size || "-",
      }));
      const wsSampling = XLSX.utils.json_to_sheet(sheetSamplingData);
      XLSX.utils.book_append_sheet(wb, wsSampling, "Monitoring Pertumbuhan");

      // 5. Sheet Panen
      const sheetPanenData = reportData.panen.map((p) => ({
        "Komoditas": getKomoditasName(p.komoditas_id),
        "Tanggal": formatDate(p.tanggal_panen || p.tanggal),
        "Berat Panen (kg)": p.berat_panen,
        "Harga Jual / kg (Rp)": p.harga_jual,
        "Pendapatan (Rp)": p.pendapatan,
      }));
      const wsPanen = XLSX.utils.json_to_sheet(sheetPanenData);
      XLSX.utils.book_append_sheet(wb, wsPanen, "Hasil Panen");

      XLSX.writeFile(wb, "Laporan_TambakKu.xlsx");
      toast.success("Excel berhasil diekspor!");
    } catch (err: any) {
      toast.error("Gagal mengekspor file Excel");
    }
  };

  // --- EXPORT TO PDF ---
  const handleExportPDF = () => {
    if (!reportData) return;

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      // Header Banner
      doc.setFillColor(37, 99, 235); // Blue 600
      doc.rect(0, 0, 210, 26, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("TAMBAKKU - LAPORAN BUDIDAYA & KEUANGAN", 14, 12);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Digitalisasi Pencatatan & Operasional Manajemen Tambak Udang / Polikultur", 14, 19);

      // Metadata Info Line
      doc.setTextColor(71, 85, 105); // Slate 600
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      
      let filterText = "Semua Kolam Tambak & Semua Siklus";
      if (selectedTambakId !== "all") {
        const tName = tambaks.find(t => t.tambak_id === selectedTambakId)?.nama_tambak || "Kolam";
        filterText = `Kolam: ${tName}`;
        if (selectedSiklusId !== "all") {
          const sNum = cycles.find(c => c.siklus_id === selectedSiklusId)?.nomor_siklus;
          filterText += ` (Siklus #${sNum})`;
        }
      }

      doc.text(`Filter Area : ${filterText}`, 14, 33);
      doc.text(`Tanggal Cetak : ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, 14, 38);

      // Section 1: Ringkasan Siklus Table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text("1. RINGKASAN REKAPITULASI SIKLUS & KEUANGAN", 14, 46);

      const siklusHeaders = [["No", "Kolam Tambak", "Siklus", "Daftar Komoditas", "Mulai", "Status", "Total Modal", "Pendapatan", "Laba / Rugi"]];
      const siklusRows = reportData.siklus.map((s, idx) => {
        const benurCost = reportData.benur.filter(b => b.siklus_id === s.siklus_id).reduce((sum, item) => sum + Number(item.total_harga || 0), 0);
        const opsCost = reportData.operasional.filter(o => o.siklus_id === s.siklus_id).reduce((sum, item) => sum + Number(item.nominal || 0), 0);
        const modal = benurCost + opsCost;
        const revenue = reportData.panen.filter(p => p.siklus_id === s.siklus_id).reduce((sum, item) => sum + Number(item.pendapatan || 0), 0);
        const laba = revenue - modal;
        const sKomoditas = reportData.komoditas.filter(k => k.siklus_id === s.siklus_id).map(k => k.nama_komoditas).join(", ");

        return [
          idx + 1,
          getTambakName(s.tambak_id),
          `#${s.nomor_siklus}`,
          sKomoditas || "Udang Vaname",
          formatDate(s.tanggal_mulai),
          s.status.toUpperCase(),
          formatIDR(modal),
          formatIDR(revenue),
          formatIDR(laba)
        ];
      });

      autoTable(doc, {
        head: siklusHeaders,
        body: siklusRows,
        startY: 49,
        theme: "grid",
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 7.5, fontStyle: "bold", halign: "center" },
        bodyStyles: { fontSize: 7, textColor: 40 },
        columnStyles: {
          0: { halign: "center", cellWidth: 8 },
          1: { cellWidth: 26 },
          2: { halign: "center", cellWidth: 14 },
          3: { cellWidth: 30 },
          4: { halign: "center", cellWidth: 20 },
          5: { halign: "center", cellWidth: 16 },
          6: { halign: "right", cellWidth: 22 },
          7: { halign: "right", cellWidth: 22 },
          8: { halign: "right", cellWidth: 24 },
        },
      });

      let currentY = (doc as any).lastAutoTable.finalY + 9;

      // Section 2: Biaya Pengeluaran & Penebaran Bibit
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text("2. BIAYA PENGELUARAN OPERASIONAL & PENEBARAN BIBIT", 14, currentY);

      const opsHeaders = [["Tanggal", "Komoditas", "Kategori", "Detail / Keterangan", "Nominal (Rp)"]];
      const rawOpsList = [
        ...reportData.benur.map(b => ({
          tanggal: b.tanggal_tebar || b.tanggal,
          komoditas: getKomoditasName(b.komoditas_id),
          kategori: "Penebaran Bibit",
          nominal: b.total_harga,
          ket: `Ukuran ${b.ukuran_PL || "-"} (${formatNumber(b.jumlah_benur)} unit)`
        })),
        ...reportData.operasional.map(o => ({
          tanggal: o.tanggal || o.tanggal_operasional,
          komoditas: getKomoditasName(o.komoditas_id),
          kategori: o.kategori,
          nominal: o.nominal,
          ket: o.keterangan || "-"
        }))
      ].sort((a, b) => new Date(a.tanggal || 0).getTime() - new Date(b.tanggal || 0).getTime());

      const opsRows = rawOpsList.map(item => [
        formatDate(item.tanggal),
        item.komoditas,
        item.kategori,
        item.ket,
        formatIDR(item.nominal)
      ]);

      autoTable(doc, {
        head: opsHeaders,
        body: opsRows,
        startY: currentY + 3,
        theme: "grid",
        headStyles: { fillColor: [51, 65, 85], textColor: 255, fontSize: 7.5, fontStyle: "bold" },
        bodyStyles: { fontSize: 7, textColor: 40 },
        columnStyles: {
          0: { halign: "center", cellWidth: 22 },
          1: { cellWidth: 38 },
          2: { cellWidth: 32 },
          3: { cellWidth: 55 },
          4: { halign: "right", cellWidth: 35 },
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 9;

      // Section 3: Monitoring Pertumbuhan & Panen Raya
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text("3. HASIL SAMPLING PERTUMBUHAN & PANEN RAYA", 14, currentY);

      const resultHeaders = [["Tanggal", "Komoditas", "Jenis Log", "Detail Biometrik / Panen", "Hasil Akhir / Pendapatan"]];
      const rawResultsList = [
        ...reportData.sampling.map(s => {
          const qty = Number(s.jumlah_udang_sampling || s.jumlah_udang || 0);
          const wt = Number(s.berat_total_sampling || s.berat_total || 0);
          const abw = s.abw;
          const sizeText = Number(s.size) > 0 ? ` (Size ${s.size})` : "";
          const detailText = qty > 0 ? `${formatNumber(qty)} unit | Total ${formatNumber(wt)} g` : `Total ${formatNumber(wt)} g`;
          return {
            tanggal: s.tanggal_sampling || s.tanggal,
            komoditas: getKomoditasName(s.komoditas_id),
            tipe: "Sampling Pertumbuhan",
            detail: detailText,
            hasil: `ABW ${abw}g${sizeText}`
          };
        }),
        ...reportData.panen.map(p => ({
          tanggal: p.tanggal_panen || p.tanggal,
          komoditas: getKomoditasName(p.komoditas_id),
          tipe: "Panen Hasil",
          detail: `${formatNumber(p.berat_panen)} kg @ ${formatIDR(p.harga_jual)}/kg`,
          hasil: `Pendapatan ${formatIDR(p.pendapatan)}`
        }))
      ].sort((a, b) => new Date(a.tanggal || 0).getTime() - new Date(b.tanggal || 0).getTime());

      const resultRows = rawResultsList.map(item => [
        formatDate(item.tanggal),
        item.komoditas,
        item.tipe,
        item.detail,
        item.hasil
      ]);

      autoTable(doc, {
        head: resultHeaders,
        body: resultRows,
        startY: currentY + 3,
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 7.5, fontStyle: "bold" },
        bodyStyles: { fontSize: 7, textColor: 40 },
        columnStyles: {
          0: { halign: "center", cellWidth: 22 },
          1: { cellWidth: 38 },
          2: { cellWidth: 32 },
          3: { cellWidth: 50 },
          4: { halign: "right", cellWidth: 40 },
        },
        didDrawPage: (data) => {
          // Footer page numbering
          const pageCount = (doc as any).internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184); // Slate 400
          doc.text(
            `Halaman ${data.pageNumber} dari ${pageCount} - TambakKu Report Engine`,
            105,
            290,
            { align: "center" }
          );
        }
      });

      doc.save("Laporan_TambakKu.pdf");
      toast.success("Dokumen PDF berhasil diunduh!");
    } catch (err: any) {
      console.error("PDF Export Error:", err);
      toast.error("Gagal mengekspor PDF: " + (err.message || "Terjadi kesalahan"));
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 text-slate-900 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Ekspor Laporan Budidaya</h3>
            <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
              Pilih opsi kolam dan tanggal, lalu klik **"Proses Laporan"** untuk mengunduh file PDF atau Excel.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900">
            Filter Data Laporan
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {isFetchLoading ? (
            <div className="flex h-20 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
              <span className="text-xs text-slate-500 font-medium">Memuat pilihan kolam tambak...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                {/* 1. Tambak */}
                <div className="space-y-1.5">
                  <Label htmlFor="tambak" className="text-xs font-semibold text-slate-700">Kolam Tambak</Label>
                  <select
                    id="tambak"
                    value={selectedTambakId}
                    onChange={(e) => setSelectedTambakId(e.target.value)}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="all">Semua Tambak</option>
                    {tambaks.map((t) => (
                      <option key={t.tambak_id} value={t.tambak_id}>
                        {t.nama_tambak}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Siklus */}
                <div className="space-y-1.5">
                  <Label htmlFor="siklus" className="text-xs font-semibold text-slate-700">Siklus Budidaya</Label>
                  <select
                    id="siklus"
                    value={selectedSiklusId}
                    onChange={(e) => setSelectedSiklusId(e.target.value)}
                    disabled={selectedTambakId === "all"}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="all">Semua Siklus</option>
                    {filteredCycles.map((c) => (
                      <option key={c.siklus_id} value={c.siklus_id}>
                        Siklus #{c.nomor_siklus} ({c.status === "aktif" ? "Aktif" : "Selesai"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Start Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="start_date" className="text-xs font-semibold text-slate-700">Dari Tanggal</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-xl border-slate-200 text-xs h-9"
                  />
                </div>

                {/* 4. End Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="end_date" className="text-xs font-semibold text-slate-700">Sampai Tanggal</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-xl border-slate-200 text-xs h-9"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button 
                  onClick={handleGenerateReport} 
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 font-bold text-xs rounded-xl shadow-xs px-5 h-9 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memuat Data...
                    </>
                  ) : (
                    <>
                      <Search className="mr-1.5 h-4 w-4" /> Proses Laporan
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview & Download Card */}
      {reportData ? (
        <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white animate-in fade-in duration-300">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Berkas Laporan Siap Diunduh</CardTitle>
              <CardDescription className="text-xs text-slate-500 font-normal">Pilih format berkas yang Anda butuhkan (Excel atau PDF).</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                onClick={handleExportExcel}
                className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs rounded-xl shadow-xs h-9 px-4 text-white"
              >
                <Download className="mr-1.5 h-4 w-4" /> Unduh Excel (.xlsx)
              </Button>
              <Button 
                onClick={handleExportPDF}
                className="bg-red-600 hover:bg-red-700 font-bold text-xs rounded-xl shadow-xs h-9 px-4 text-white"
              >
                <Download className="mr-1.5 h-4 w-4" /> Unduh PDF (.pdf)
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Summary stats */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border-2 border-slate-100 p-4 bg-slate-50/50">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Kolam Terpilih</span>
                  <span className="text-base font-black text-slate-900 mt-1 block">
                    {selectedTambakId === "all" ? `${reportData.tambaks.length} Kolam` : getTambakName(selectedTambakId)}
                  </span>
                </div>
                <div className="rounded-2xl border-2 border-slate-100 p-4 bg-slate-50/50">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Catatan Biaya</span>
                  <span className="text-base font-black text-slate-900 mt-1 block">
                    {reportData.benur.length + reportData.operasional.length} Catatan
                  </span>
                </div>
                <div className="rounded-2xl border-2 border-slate-100 p-4 bg-slate-50/50">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Berat Panen</span>
                  <span className="text-base font-black text-emerald-700 mt-1 block">
                    {formatNumber(reportData.panen.reduce((s, i) => s + Number(i.berat_panen || 0), 0))} kg
                  </span>
                </div>
              </div>

              {/* Tips banner */}
              <div className="rounded-2xl border-2 border-blue-100 bg-blue-50/50 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-blue-950">💡 Petunjuk Cetak Laporan</h4>
                  <p className="text-xs text-blue-800 leading-relaxed font-medium mt-0.5">
                    Gunakan berkas <strong>PDF</strong> apabila ingin mencetak fisik ke kertas (sebagai laporan ke pengurus KKN/Pemerintah Desa). Gunakan <strong>Excel</strong> jika ingin mengolah angka pembukuan di komputer.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Empty Preview State */
        <div className="rounded-3xl border-2 border-dashed border-slate-200 py-14 text-center bg-slate-50/40 px-4">
          <FileText className="h-12 w-12 text-blue-400 stroke-1 mx-auto mb-3" />
          <h3 className="text-base font-black text-slate-800">Klik "Proses Laporan" Di Atas</h3>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed mx-auto mt-1 font-medium">
            Pilih kolam tambak Anda di atas, lalu tekan tombol biru <strong>"Proses Laporan"</strong> untuk mengunduh laporan PDF atau Excel.
          </p>
        </div>
      )}
    </div>
  );
}
