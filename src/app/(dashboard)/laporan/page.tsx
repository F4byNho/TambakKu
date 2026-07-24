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
import { usePokdakan } from "@/context/pokdakan-context";

interface TambakItem {
  tambak_id: string;
  nama_tambak: string;
  lokasi: string;
  luas_tambak: number;
  nama_anggota?: string;
  anggota_id?: string;
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
  const { activeTambak, activeAnggota, anggotaList } = usePokdakan();
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
  const [activeTab, setActiveTab] = useState<"pokdakan" | "siklus" | "ops">("pokdakan");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const tab = searchParams.get("tab");
      if (tab && ["pokdakan", "siklus", "ops"].includes(tab)) {
        setActiveTab(tab as any);
      }
    }
  }, []);

  const handleTabChange = (value: "pokdakan" | "siklus" | "ops") => {
    setActiveTab(value);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("tab", value);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, [activeAnggota, activeTambak]);

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
      const urlTambak = activeAnggota 
        ? `/api/tambak?anggotaId=${activeAnggota.anggota_id}`
        : "/api/tambak";

      const urlSiklus = activeAnggota
        ? `/api/siklus?anggotaId=${activeAnggota.anggota_id}`
        : "/api/siklus";
        
      const [resTambak, resSiklus] = await Promise.all([
        fetch(urlTambak),
        fetch(urlSiklus),
      ]);
      const jsonTambak = await resTambak.json();
      const jsonSiklus = await resSiklus.json();

      const fetchedTambaks: TambakItem[] = jsonTambak.data || [];
      let fetchedCycles: SiklusItem[] = jsonSiklus.data || [];

      if (activeAnggota) {
        const memberTambakIds = new Set(fetchedTambaks.map(t => t.tambak_id));
        fetchedCycles = fetchedCycles.filter(c => memberTambakIds.has(c.tambak_id));
      }

      setTambaks(fetchedTambaks);
      setCycles(fetchedCycles);

      if (activeTambak && fetchedTambaks.some(t => t.tambak_id === activeTambak.tambak_id)) {
        setSelectedTambakId(activeTambak.tambak_id);
      } else if (activeAnggota && fetchedTambaks.length > 0) {
        setSelectedTambakId(fetchedTambaks[0].tambak_id);
      } else if (activeAnggota && fetchedTambaks.length === 0) {
        setSelectedTambakId("none");
      } else if (fetchedTambaks.length === 1) {
        setSelectedTambakId(fetchedTambaks[0].tambak_id);
      }
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
      if (selectedTambakId !== "all") {
        query.append("tambakId", selectedTambakId);
      } else if (activeAnggota) {
        // Mode personal: filter laporan berdasarkan anggotaId agar tidak bocor ke data pokdakan
        query.append("anggotaId", activeAnggota.anggota_id);
      }
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
        const sKomoditasNames = Array.from(new Set(reportData.komoditas.filter(k => k.siklus_id === s.siklus_id).map(k => k.nama_komoditas).filter(Boolean)));
        const sKomoditas = sKomoditasNames.join(", ");
        
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

      // 6. Sheet Data Budidaya & Produksi Pokdakan
      const filteredBenurs = reportData.benur || [];
      const filteredPanens = reportData.panen || [];

      const validSiklusIds = new Set((reportData.siklus || []).map(s => s.siklus_id));
      const rawKomoditas = (reportData.komoditas || []).filter(k => !k.siklus_id || validSiklusIds.has(k.siklus_id));

      const uniqueCommodityMap = new Map<string, any>();
      rawKomoditas.forEach((k) => {
        const key = (k.nama_komoditas || k.jenis_komoditas || "Udang Vaname").trim().toLowerCase();
        if (!uniqueCommodityMap.has(key)) {
          uniqueCommodityMap.set(key, k);
        }
      });

      let commoditiesToDisplay = Array.from(uniqueCommodityMap.values());
      if (!commoditiesToDisplay || commoditiesToDisplay.length === 0) {
        const types = Array.from(new Set(filteredBenurs.map(b => b.jenis_udang).filter(Boolean)));
        commoditiesToDisplay = types.map((t, idx) => ({
          komoditas_id: `derived_${idx}`,
          nama_komoditas: t,
          jenis_komoditas: t,
        }));
      }

      const sheetPokdakanData = commoditiesToDisplay.map((k, idx) => {
        const kBenur = filteredBenurs.filter(b => 
          (k.komoditas_id && !k.komoditas_id.startsWith("derived_") && b.komoditas_id ? b.komoditas_id === k.komoditas_id : true) ||
          b.jenis_udang?.toLowerCase() === k.nama_komoditas?.toLowerCase()
        );
        const kPanen = filteredPanens.filter(p => 
          (k.komoditas_id && !k.komoditas_id.startsWith("derived_") && p.komoditas_id ? p.komoditas_id === k.komoditas_id : true)
        );

        const targetBenurs = kBenur.length > 0 ? kBenur : filteredBenurs;
        const totalBenurTebar = targetBenurs.reduce((sum, b) => sum + Number(b.jumlah_benur || 0), 0);
        const asalBenihStr = targetBenurs.find(b => b.asal_benih && String(b.asal_benih).trim() !== "")?.asal_benih || "-";

        const targetPanens = kPanen.length > 0 ? kPanen : filteredPanens;
        const totalPanenKg = targetPanens.reduce((sum, p) => sum + Number(p.berat_panen || 0), 0);

        const totalUdangPanen = targetPanens.reduce((sum, p) => {
          if (p.jumlah_ekor) return sum + Number(p.jumlah_ekor);
          if (p.size && p.berat_panen) return sum + (Number(p.berat_panen) * Number(p.size));
          return sum;
        }, 0);

        const isSeaweed = k.jenis_komoditas === "rumput_laut" || k.nama_komoditas?.toLowerCase().includes("rumput laut");

        const avgSize = !isSeaweed && (targetPanens.find(p => p.size)?.size || (totalPanenKg > 0 && totalUdangPanen > 0 ? Math.round(totalUdangPanen / totalPanenKg) : "-"));

        let srVal: number | undefined = undefined;
        if (!isSeaweed && totalBenurTebar > 0 && totalUdangPanen > 0) {
          srVal = (totalUdangPanen / totalBenurTebar) * 100;
        } else if (!isSeaweed) {
          const storedSR = targetPanens.find(p => p.sr_percent !== undefined && Number(p.sr_percent) > 0)?.sr_percent;
          if (storedSR) srVal = Number(storedSR);
        }

        return {
          "No": idx + 1,
          "Jenis Ikan / Komoditas": k.nama_komoditas || k.jenis_komoditas || "Udang Vaname",
          "Asal Benih": asalBenihStr,
          "Jumlah Tebar": totalBenurTebar > 0 ? `${formatNumber(totalBenurTebar)} ${isSeaweed ? "kg" : "ekor"}` : "-",
          "SR (%)": !isSeaweed && srVal !== undefined ? `${srVal.toFixed(1).replace(".", ",")}%` : "-",
          "Produksi 1 Siklus": totalPanenKg > 0 ? `${formatNumber(totalPanenKg)} kg` : "-",
          "Siklus Pemeliharaan": "2-3 kali/tahun",
          "Ukuran Panen": avgSize && avgSize !== "-" ? `${avgSize} ekor/kg` : "-"
        };
      });

      const wsPokdakan = XLSX.utils.json_to_sheet(sheetPokdakanData);
      XLSX.utils.book_append_sheet(wb, wsPokdakan, "Data Budidaya Pokdakan");

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
      const pageWidth = doc.internal.pageSize.getWidth(); // 210mm

      // Header Banner - Executive Dark Slate Header with Royal Accent Bar
      doc.setFillColor(15, 23, 42); // Slate 900
      doc.rect(0, 0, pageWidth, 28, "F");

      // Accent Bar Line (Gradient simulation with 2 lines)
      doc.setFillColor(37, 99, 235); // Blue 600
      doc.rect(0, 26, pageWidth * 0.6, 2, "F");
      doc.setFillColor(16, 185, 129); // Emerald 500
      doc.rect(pageWidth * 0.6, 26, pageWidth * 0.4, 2, "F");

      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("TAMBAKKU — LAPORAN BUDIDAYA & KEUANGAN DIGITAL", 14, 13);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225); // Slate 300
      doc.text("Sistem Digitalisasi Pencatatan, Operasional, & Manajemen Tambak Budidaya", 14, 20);

      // Metadata Summary Box
      let tambakText = "Semua Kolam Tambak";
      let siklusText = "Semua Siklus";
      let pemilikText = "Semua Anggota";

      if (selectedTambakId !== "all") {
        const tItem = tambaks.find(t => t.tambak_id === selectedTambakId);
        tambakText = tItem?.nama_tambak || "Kolam";
        
        if (tItem) {
          if (tItem.nama_anggota) {
            pemilikText = tItem.nama_anggota;
          } else {
            const matchAnggota = anggotaList.find(a => a.anggota_id === tItem.anggota_id);
            if (matchAnggota) {
              pemilikText = matchAnggota.nama_anggota;
            } else if (activeAnggota) {
              pemilikText = activeAnggota.nama_anggota;
            } else {
              pemilikText = "-";
            }
          }
        }

        if (selectedSiklusId !== "all") {
          const sNum = cycles.find(c => c.siklus_id === selectedSiklusId)?.nomor_siklus;
          siklusText = `Siklus #${sNum}`;
        }
      } else if (activeAnggota) {
        pemilikText = activeAnggota.nama_anggota;
      }

      const tanggalCetak = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

      // Metadata Background Box
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.3);
      doc.roundedRect(14, 32, pageWidth - 28, 14, 2, 2, "FD");

      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139); // Slate 500
      doc.setFont("helvetica", "bold");
      doc.text("KOLAM / TAMBAK:", 18, 38);
      doc.text("PEMILIK TAMBAK:", 68, 38);
      doc.text("SIKLUS BUDIDAYA:", 118, 38);
      doc.text("TANGGAL CETAK:", 160, 38);

      doc.setTextColor(15, 23, 42); // Slate 900
      doc.setFont("helvetica", "bold");
      doc.text(tambakText, 18, 43);
      doc.text(pemilikText, 68, 43);
      doc.text(siklusText, 118, 43);
      doc.text(tanggalCetak, 160, 43);

      // --- Executive KPI Metric Summary Cards (PDF Header Stats) ---
      const totalBenurCost = reportData.benur.reduce((sum, item) => sum + Number(item.total_harga || 0), 0);
      const totalOpsCost = reportData.operasional.reduce((sum, item) => sum + Number(item.nominal || 0), 0);
      const totalModal = totalBenurCost + totalOpsCost;
      const totalRevenue = reportData.panen.reduce((sum, item) => sum + Number(item.pendapatan || 0), 0);
      const totalLaba = totalRevenue - totalModal;
      const totalBeratPanen = reportData.panen.reduce((sum, item) => sum + Number(item.berat_panen || 0), 0);

      const kpiCardWidth = (pageWidth - 28 - 9) / 4; // 4 cards with 3mm gap
      const kpiY = 49;
      const kpiHeight = 13;

      // KPI Card 1: Total Modal
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, kpiY, kpiCardWidth, kpiHeight, 1.5, 1.5, "FD");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text("TOTAL MODAL", 17, kpiY + 4.5);
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(formatIDR(totalModal), 17, kpiY + 9.5);

      // KPI Card 2: Total Pendapatan
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(167, 243, 208);
      doc.roundedRect(14 + kpiCardWidth + 3, kpiY, kpiCardWidth, kpiHeight, 1.5, 1.5, "FD");
      doc.setFontSize(6.5);
      doc.setTextColor(4, 120, 87);
      doc.setFont("helvetica", "bold");
      doc.text("PENDAPATAN", 17 + kpiCardWidth + 3, kpiY + 4.5);
      doc.setFontSize(8);
      doc.setTextColor(6, 95, 70);
      doc.text(formatIDR(totalRevenue), 17 + kpiCardWidth + 3, kpiY + 9.5);

      // KPI Card 3: Laba / Rugi
      const isProfit = totalLaba >= 0;
      doc.setFillColor(isProfit ? 240 : 254, isProfit ? 253 : 242, isProfit ? 244 : 242);
      doc.setDrawColor(isProfit ? 187 : 254, isProfit ? 247 : 202, isProfit ? 208 : 202);
      doc.roundedRect(14 + (kpiCardWidth + 3) * 2, kpiY, kpiCardWidth, kpiHeight, 1.5, 1.5, "FD");
      doc.setFontSize(6.5);
      doc.setTextColor(isProfit ? 21 : 153, isProfit ? 128 : 27, isProfit ? 61 : 27);
      doc.setFont("helvetica", "bold");
      doc.text(isProfit ? "LABA BERSIH" : "RUGI BERSIH", 17 + (kpiCardWidth + 3) * 2, kpiY + 4.5);
      doc.setFontSize(8);
      doc.setTextColor(isProfit ? 22 : 153, isProfit ? 101 : 27, isProfit ? 52 : 27);
      doc.text(formatIDR(totalLaba), 17 + (kpiCardWidth + 3) * 2, kpiY + 9.5);

      // KPI Card 4: Total Panen
      doc.setFillColor(239, 246, 255);
      doc.setDrawColor(191, 219, 254);
      doc.roundedRect(14 + (kpiCardWidth + 3) * 3, kpiY, kpiCardWidth, kpiHeight, 1.5, 1.5, "FD");
      doc.setFontSize(6.5);
      doc.setTextColor(29, 78, 216);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL HASIL PANEN", 17 + (kpiCardWidth + 3) * 3, kpiY + 4.5);
      doc.setFontSize(8);
      doc.setTextColor(30, 58, 138);
      doc.text(`${formatNumber(totalBeratPanen)} kg`, 17 + (kpiCardWidth + 3) * 3, kpiY + 9.5);

      // Section 1: Ringkasan Siklus Table
      let currentY = 67;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text("1. RINGKASAN REKAPITULASI SIKLUS & KEUANGAN", 14, currentY);

      const siklusHeaders = [["No", "Kolam Tambak", "Siklus", "Daftar Komoditas", "Mulai", "Status", "Total Modal", "Pendapatan", "Laba / Rugi"]];
      const siklusRows = reportData.siklus.map((s, idx) => {
        const benurCost = reportData.benur.filter(b => b.siklus_id === s.siklus_id).reduce((sum, item) => sum + Number(item.total_harga || 0), 0);
        const opsCost = reportData.operasional.filter(o => o.siklus_id === s.siklus_id).reduce((sum, item) => sum + Number(item.nominal || 0), 0);
        const modal = benurCost + opsCost;
        const revenue = reportData.panen.filter(p => p.siklus_id === s.siklus_id).reduce((sum, item) => sum + Number(item.pendapatan || 0), 0);
        const laba = revenue - modal;
        const sKomoditasNames = Array.from(new Set(reportData.komoditas.filter(k => k.siklus_id === s.siklus_id).map(k => k.nama_komoditas).filter(Boolean)));
        const sKomoditas = sKomoditasNames.join(", ");

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
        startY: currentY + 3,
        theme: "striped",
        headStyles: { 
          fillColor: [30, 41, 59], // Slate 800
          textColor: 255, 
          fontSize: 7.5, 
          fontStyle: "bold", 
          halign: "center",
          cellPadding: 2.5
        },
        bodyStyles: { fontSize: 7, textColor: 50, cellPadding: 2 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: {
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 8 },
          1: { cellWidth: 26 },
          2: { halign: "center", cellWidth: 14 },
          3: { cellWidth: 30 },
          4: { halign: "center", cellWidth: 20 },
          5: { halign: "center", cellWidth: 16 },
          6: { halign: "right", cellWidth: 22, fontStyle: "bold" },
          7: { halign: "right", cellWidth: 22, fontStyle: "bold" },
          8: { halign: "right", cellWidth: 24, fontStyle: "bold" },
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;

      // Section 2: Biaya Pengeluaran & Penebaran Bibit
      if (currentY > 235) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text("2. DETAIL BIAYA PENGELUARAN OPERASIONAL & BIBIT", 14, currentY);

      const opsHeaders = [["Tanggal", "Komoditas", "Kategori Pengeluaran", "Detail / Keterangan", "Nominal (Rp)"]];
      const rawOpsList = [
        ...reportData.benur.map(b => ({
          tanggal: b.tanggal_tebar || b.tanggal,
          komoditas: getKomoditasName(b.komoditas_id),
          kategori: "Penebaran Bibit",
          nominal: Number(b.total_harga || 0),
          ket: `Ukuran ${b.ukuran_PL || "-"} (${formatNumber(b.jumlah_benur)} unit)`
        })),
        ...reportData.operasional.map(o => ({
          tanggal: o.tanggal || o.tanggal_operasional,
          komoditas: getKomoditasName(o.komoditas_id),
          kategori: o.kategori,
          nominal: Number(o.nominal || 0),
          ket: o.keterangan || "-"
        }))
      ].sort((a, b) => new Date(a.tanggal || 0).getTime() - new Date(b.tanggal || 0).getTime());

      const totalPengeluaran = rawOpsList.reduce((sum, item) => sum + item.nominal, 0);

      const opsRows = rawOpsList.map(item => [
        formatDate(item.tanggal),
        item.komoditas,
        item.kategori,
        item.ket,
        formatIDR(item.nominal)
      ]);

      // Subtotal footer row
      if (opsRows.length > 0) {
        opsRows.push([
          "",
          "",
          "",
          "TOTAL PENGELUARAN",
          formatIDR(totalPengeluaran)
        ]);
      }

      autoTable(doc, {
        head: opsHeaders,
        body: opsRows,
        startY: currentY + 3,
        theme: "striped",
        headStyles: { 
          fillColor: [37, 99, 235], // Blue 600
          textColor: 255, 
          fontSize: 7.5, 
          fontStyle: "bold",
          cellPadding: 2.5 
        },
        bodyStyles: { fontSize: 7, textColor: 50, cellPadding: 2 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: {
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 22 },
          1: { cellWidth: 36 },
          2: { cellWidth: 34 },
          3: { cellWidth: 55 },
          4: { halign: "right", cellWidth: 35, fontStyle: "bold" },
        },
        didParseCell: (data) => {
          // Highlight total row at the bottom
          if (data.row.index === opsRows.length - 1 && opsRows.length > 1) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [241, 245, 249]; // Slate 100
            data.cell.styles.textColor = [15, 23, 42];
          }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;

      // Section 3: Monitoring Pertumbuhan & Panen Raya
      if (currentY > 235) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text("3. HASIL SAMPLING PERTUMBUHAN & HASIL PANEN RAYA", 14, currentY);

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
        theme: "striped",
        headStyles: { 
          fillColor: [16, 185, 129], // Emerald 600
          textColor: 255, 
          fontSize: 7.5, 
          fontStyle: "bold",
          cellPadding: 2.5 
        },
        bodyStyles: { fontSize: 7, textColor: 50, cellPadding: 2 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: {
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 22 },
          1: { cellWidth: 36 },
          2: { cellWidth: 34 },
          3: { cellWidth: 50 },
          4: { halign: "right", cellWidth: 40, fontStyle: "bold" },
        },
      });

      // Section 4: Data Budidaya & Produksi Pokdakan (Format Resmi Kertas Kelompok Tani)
      currentY = (doc as any).lastAutoTable.finalY + 10;
      if (currentY > 220) {
        doc.addPage();
        currentY = 20;
      }

      const activeAnggotaNama = reportData.tambaks?.[0]?.nama_anggota || "KELOMPOK TANI / POKDAKAN";

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`4. DATA BUDIDAYA DAN PRODUKSI ${activeAnggotaNama.toUpperCase()}`, 14, currentY);

      const pokdakanHeaders = [[
        "No",
        "Jenis Ikan / Komoditas",
        "Asal Benih",
        "Jumlah Tebar",
        "SR (%)",
        "Produksi 1 Siklus",
        "Siklus Pemeliharaan",
        "Ukuran Panen"
      ]];

      const filteredBenurs = reportData.benur || [];
      const filteredPanens = reportData.panen || [];

      // Deduplikasi komoditas berdasarkan nama agar setiap jenis komoditas hanya muncul 1x di Tabel 4
      const validSiklusIds = new Set((reportData.siklus || []).map(s => s.siklus_id));
      const rawKomoditas = (reportData.komoditas || []).filter(k => !k.siklus_id || validSiklusIds.has(k.siklus_id));
      
      const uniqueCommodityMap = new Map<string, any>();
      rawKomoditas.forEach((k) => {
        const key = (k.nama_komoditas || k.jenis_komoditas || "Udang Vaname").trim().toLowerCase();
        if (!uniqueCommodityMap.has(key)) {
          uniqueCommodityMap.set(key, k);
        }
      });

      let commoditiesToDisplay = Array.from(uniqueCommodityMap.values());
      if (!commoditiesToDisplay || commoditiesToDisplay.length === 0) {
        const types = Array.from(new Set(filteredBenurs.map(b => b.jenis_udang).filter(Boolean)));
        commoditiesToDisplay = types.map((t, idx) => ({
          komoditas_id: `derived_${idx}`,
          nama_komoditas: t,
          jenis_komoditas: t,
        }));
      }

      const pokdakanRows = commoditiesToDisplay.map((k, idx) => {
        const kBenur = filteredBenurs.filter(b => 
          (k.komoditas_id && !k.komoditas_id.startsWith("derived_") && b.komoditas_id ? b.komoditas_id === k.komoditas_id : true) ||
          b.jenis_udang?.toLowerCase() === k.nama_komoditas?.toLowerCase()
        );
        const kPanen = filteredPanens.filter(p => 
          (k.komoditas_id && !k.komoditas_id.startsWith("derived_") && p.komoditas_id ? p.komoditas_id === k.komoditas_id : true)
        );

        const targetBenurs = kBenur.length > 0 ? kBenur : filteredBenurs;
        const totalBenurTebar = targetBenurs.reduce((sum, b) => sum + Number(b.jumlah_benur || 0), 0);
        const asalBenihStr = targetBenurs.find(b => b.asal_benih && String(b.asal_benih).trim() !== "")?.asal_benih || "-";

        const targetPanens = kPanen.length > 0 ? kPanen : filteredPanens;
        const totalPanenKg = targetPanens.reduce((sum, p) => sum + Number(p.berat_panen || 0), 0);
        
        const totalUdangPanen = targetPanens.reduce((sum, p) => {
          if (p.jumlah_ekor) return sum + Number(p.jumlah_ekor);
          if (p.size && p.berat_panen) return sum + (Number(p.berat_panen) * Number(p.size));
          return sum;
        }, 0);

        const isSeaweed = k.jenis_komoditas === "rumput_laut" || k.nama_komoditas?.toLowerCase().includes("rumput laut");

        const avgSize = !isSeaweed && (targetPanens.find(p => p.size)?.size || (totalPanenKg > 0 && totalUdangPanen > 0 ? Math.round(totalUdangPanen / totalPanenKg) : "-"));

        let srVal: number | undefined = undefined;
        if (!isSeaweed && totalBenurTebar > 0 && totalUdangPanen > 0) {
          srVal = (totalUdangPanen / totalBenurTebar) * 100;
        } else if (!isSeaweed) {
          const storedSR = targetPanens.find(p => p.sr_percent !== undefined && Number(p.sr_percent) > 0)?.sr_percent;
          if (storedSR) srVal = Number(storedSR);
        }

        const srPercentStr = !isSeaweed && srVal !== undefined ? `${srVal.toFixed(1).replace(".", ",")}%` : "-";

        return [
          idx + 1,
          k.nama_komoditas || k.jenis_komoditas || "-",
          asalBenihStr,
          totalBenurTebar > 0 ? `${formatNumber(totalBenurTebar)} ${isSeaweed ? "kg" : "ekor"}` : "-",
          srPercentStr,
          totalPanenKg > 0 ? `${formatNumber(totalPanenKg)} kg` : "-",
          totalPanenKg > 0 || totalBenurTebar > 0 ? "2-3 kali/tahun" : "-",
          avgSize && avgSize !== "-" ? `${avgSize} ekor/kg` : "-"
        ];
      });

      if (pokdakanRows.length === 0) {
        pokdakanRows.push([
          "-",
          "Belum ada data komoditas",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-"
        ]);
      }

      autoTable(doc, {
        head: pokdakanHeaders,
        body: pokdakanRows,
        startY: currentY + 3,
        theme: "striped",
        headStyles: { 
          fillColor: [15, 23, 42], // Slate 900
          textColor: 255, 
          fontSize: 7.5, 
          fontStyle: "bold",
          halign: "center",
          cellPadding: 2.5 
        },
        bodyStyles: { fontSize: 7, textColor: 50, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: {
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 8 },
          1: { cellWidth: 30 },
          2: { cellWidth: 26 },
          3: { halign: "right", cellWidth: 26 },
          4: { halign: "center", cellWidth: 16, fontStyle: "bold" },
          5: { halign: "right", cellWidth: 24, fontStyle: "bold" },
          6: { halign: "center", cellWidth: 26 },
          7: { halign: "center", cellWidth: 26, fontStyle: "bold" },
        },
        didDrawPage: (data) => {
          // Page Numbering Footer on every page
          const totalPages = (doc as any).internal.getNumberOfPages();

          // Footer Line
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          doc.line(14, 283, pageWidth - 14, 283);

          doc.setFontSize(7.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(148, 163, 184); // Slate 400
          doc.text("TambakKu Engine — Laporan Budidaya & Keuangan Digital", 14, 288);
          doc.text(`Halaman ${data.pageNumber} dari ${totalPages}`, pageWidth - 14, 288, { align: "right" });
        }
      });

      doc.save(`Laporan_TambakKu_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Dokumen PDF berhasil diunduh!");
    } catch (err: any) {
      console.error("PDF Export Error:", err);
      toast.error("Gagal mengekspor PDF: " + (err.message || "Terjadi kesalahan"));
    }
  };

  // Live preview helpers
  const calculatedTotalModal = reportData ? (
    reportData.benur.reduce((s, b) => s + Number(b.total_harga || 0), 0) +
    reportData.operasional.reduce((s, o) => s + Number(o.nominal || 0), 0)
  ) : 0;
  const calculatedTotalRevenue = reportData ? reportData.panen.reduce((s, p) => s + Number(p.pendapatan || 0), 0) : 0;
  const calculatedTotalLaba = calculatedTotalRevenue - calculatedTotalModal;
  const calculatedTotalBeratPanen = reportData ? reportData.panen.reduce((s, p) => s + Number(p.berat_panen || 0), 0) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 text-slate-900 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Ekspor & Cetak Laporan Budidaya</h3>
            <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
              Pilih opsi kolam dan rentang tanggal, lalu klik <span className="font-semibold text-slate-800">"Proses Laporan"</span> untuk melihat pratinjau data dan mengunduh berkas PDF atau Excel.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span>Filter Data Laporan</span>
            <span className="text-xs font-normal text-slate-400">Pilih kriteria data</span>
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
                    className="w-full h-9.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                  >
                    {/* Mode pokdakan: tampilkan "Semua Tambak". Mode personal: tidak ada pilihan agregat "Semua Tambak Saya" */}
                    {!activeAnggota && (
                      <option value="all">Semua Tambak</option>
                    )}
                    {activeAnggota && tambaks.length === 0 && (
                      <option value="none" disabled>— Belum ada tambak —</option>
                    )}
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
                    className="w-full h-9.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-400 transition-all"
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
                    className="rounded-xl border-slate-200 text-xs h-9.5"
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
                    className="rounded-xl border-slate-200 text-xs h-9.5"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col items-end gap-2">
                {/* Peringatan jika mode personal tapi belum punya tambak */}
                {activeAnggota && tambaks.length === 0 && (
                  <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                    Tambahkan tambak terlebih dahulu untuk dapat mencetak laporan.
                  </p>
                )}
                <Button 
                  onClick={handleGenerateReport} 
                  disabled={isLoading || (!!activeAnggota && tambaks.length === 0)}
                  className="bg-blue-600 hover:bg-blue-700 font-bold text-xs rounded-xl shadow-2xs px-5 h-10 text-white gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memuat Data Laporan...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" /> Proses Laporan
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
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Executive Download Bar */}
          <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Berkas Laporan Siap Diunduh</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md uppercase">Siap</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 font-normal">Pilih format berkas yang Anda butuhkan (Excel atau PDF).</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  onClick={handleExportExcel}
                  className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs rounded-xl shadow-2xs h-10 px-4 text-white gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="h-4 w-4" /> Unduh Excel (.xlsx)
                </Button>
                <Button 
                  onClick={handleExportPDF}
                  className="bg-red-600 hover:bg-red-700 font-bold text-xs rounded-xl shadow-2xs h-10 px-4 text-white gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="h-4 w-4" /> Unduh PDF (.pdf)
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {/* Stat Summary Cards */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-100 p-3.5 bg-slate-50/60">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Modal</span>
                  <span className="text-sm font-black text-slate-900 mt-0.5 block">{formatIDR(calculatedTotalModal)}</span>
                </div>
                <div className="rounded-xl border border-emerald-100 p-3.5 bg-emerald-50/40">
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Total Pendapatan</span>
                  <span className="text-sm font-black text-emerald-800 mt-0.5 block">{formatIDR(calculatedTotalRevenue)}</span>
                </div>
                <div className={`rounded-xl border p-3.5 ${calculatedTotalLaba >= 0 ? "border-emerald-100 bg-emerald-50/40" : "border-red-100 bg-red-50/40"}`}>
                  <span className={`text-[11px] font-bold uppercase tracking-wider block ${calculatedTotalLaba >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {calculatedTotalLaba >= 0 ? "Laba Bersih" : "Rugi Bersih"}
                  </span>
                  <span className={`text-sm font-black mt-0.5 block ${calculatedTotalLaba >= 0 ? "text-emerald-800" : "text-red-800"}`}>
                    {formatIDR(calculatedTotalLaba)}
                  </span>
                </div>
                <div className="rounded-xl border border-blue-100 p-3.5 bg-blue-50/40">
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Total Hasil Panen</span>
                  <span className="text-sm font-black text-blue-900 mt-0.5 block">{formatNumber(calculatedTotalBeratPanen)} kg</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Browser Report Preview Section */}
          <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 pb-3 bg-slate-50/40">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">Pratinjau Data Laporan</CardTitle>
                  <CardDescription className="text-xs text-slate-500 font-normal">Hasil olah data riil yang akan tercetak di PDF/Excel.</CardDescription>
                </div>
                {/* Preview Tabs */}
                <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
                  <button
                    onClick={() => handleTabChange("pokdakan")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === "pokdakan"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Data Budidaya Pokdakan
                  </button>
                  <button
                    onClick={() => handleTabChange("siklus")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === "siklus"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Ringkasan Siklus
                  </button>
                  <button
                    onClick={() => handleTabChange("ops")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === "ops"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Detail Catatan Biaya & Panen
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Tab 1: Data Budidaya Pokdakan (Tabel 4) */}
              {activeTab === "pokdakan" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white font-semibold">
                      <tr>
                        <th className="px-4 py-3 text-center w-12">No</th>
                        <th className="px-4 py-3">Jenis Ikan / Komoditas</th>
                        <th className="px-4 py-3">Asal Benih</th>
                        <th className="px-4 py-3 text-right">Jumlah Tebar</th>
                        <th className="px-4 py-3 text-center">SR (%)</th>
                        <th className="px-4 py-3 text-right">Produksi 1 Siklus</th>
                        <th className="px-4 py-3 text-center">Siklus Pemeliharaan</th>
                        <th className="px-4 py-3 text-center">Ukuran Panen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {(() => {
                        const validSiklusIds = new Set((reportData.siklus || []).map(s => s.siklus_id));
                        const rawKomoditas = (reportData.komoditas || []).filter(k => !k.siklus_id || validSiklusIds.has(k.siklus_id));
                        
                        const uniqueMap = new Map<string, any>();
                        rawKomoditas.forEach((k) => {
                          const key = (k.nama_komoditas || k.jenis_komoditas || "Udang Vaname").trim().toLowerCase();
                          if (!uniqueMap.has(key)) uniqueMap.set(key, k);
                        });

                        let list = Array.from(uniqueMap.values());
                        if (list.length === 0) {
                          const types = Array.from(new Set(reportData.benur.map(b => b.jenis_udang).filter(Boolean)));
                          list = types.map((t, idx) => ({
                            komoditas_id: `derived_${idx}`,
                            nama_komoditas: t,
                            jenis_komoditas: t,
                          }));
                        }

                        if (list.length === 0) {
                          return (
                            <tr>
                              <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-medium">
                                Belum ada data budidaya & komoditas yang dicatat
                              </td>
                            </tr>
                          );
                        }

                        return list.map((k, idx) => {
                          const kBenur = reportData.benur.filter(b => 
                            (k.komoditas_id && !k.komoditas_id.startsWith("derived_") && b.komoditas_id ? b.komoditas_id === k.komoditas_id : true) ||
                            b.jenis_udang?.toLowerCase() === k.nama_komoditas?.toLowerCase()
                          );
                          const kPanen = reportData.panen.filter(p => 
                            (k.komoditas_id && !k.komoditas_id.startsWith("derived_") && p.komoditas_id ? p.komoditas_id === k.komoditas_id : true)
                          );

                          const targetBenurs = kBenur.length > 0 ? kBenur : reportData.benur;
                          const totalBenurTebar = targetBenurs.reduce((sum, b) => sum + Number(b.jumlah_benur || 0), 0);
                          const asalBenihStr = targetBenurs.find(b => b.asal_benih && String(b.asal_benih).trim() !== "")?.asal_benih || "-";

                          const targetPanens = kPanen.length > 0 ? kPanen : reportData.panen;
                          const totalPanenKg = targetPanens.reduce((sum, p) => sum + Number(p.berat_panen || 0), 0);
                          
                          const totalUdangPanen = targetPanens.reduce((sum, p) => {
                            if (p.jumlah_ekor) return sum + Number(p.jumlah_ekor);
                            if (p.size && p.berat_panen) return sum + (Number(p.berat_panen) * Number(p.size));
                            return sum;
                          }, 0);

                          const isSeaweed = k.jenis_komoditas === "rumput_laut" || k.nama_komoditas?.toLowerCase().includes("rumput laut");
                          const avgSize = !isSeaweed && (targetPanens.find(p => p.size)?.size || (totalPanenKg > 0 && totalUdangPanen > 0 ? Math.round(totalUdangPanen / totalPanenKg) : "-"));

                          let srVal: number | undefined = undefined;
                          if (!isSeaweed && totalBenurTebar > 0 && totalUdangPanen > 0) {
                            srVal = (totalUdangPanen / totalBenurTebar) * 100;
                          } else if (!isSeaweed) {
                            const storedSR = targetPanens.find(p => p.sr_percent !== undefined && Number(p.sr_percent) > 0)?.sr_percent;
                            if (storedSR) srVal = Number(storedSR);
                          }
                          const srPercentStr = !isSeaweed && srVal !== undefined ? `${srVal.toFixed(1).replace(".", ",")}%` : "-";

                          return (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3 text-center font-bold text-slate-500">{idx + 1}</td>
                              <td className="px-4 py-3 font-extrabold text-slate-900">
                                {k.nama_komoditas || k.jenis_komoditas || "-"}
                              </td>
                              <td className="px-4 py-3 text-slate-600 capitalize">{asalBenihStr}</td>
                              <td className="px-4 py-3 text-right font-medium">
                                {totalBenurTebar > 0 ? `${formatNumber(totalBenurTebar)} ${isSeaweed ? "kg" : "ekor"}` : "-"}
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-blue-600">{srPercentStr}</td>
                              <td className="px-4 py-3 text-right font-black text-emerald-700">
                                {totalPanenKg > 0 ? `${formatNumber(totalPanenKg)} kg` : "-"}
                              </td>
                              <td className="px-4 py-3 text-center text-slate-500">
                                {totalPanenKg > 0 || totalBenurTebar > 0 ? "2-3 kali/tahun" : "-"}
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-slate-700">
                                {avgSize && avgSize !== "-" ? `${avgSize} ekor/kg` : "-"}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 2: Ringkasan Siklus */}
              {activeTab === "siklus" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800 text-white font-semibold">
                      <tr>
                        <th className="px-4 py-3 text-center w-12">No</th>
                        <th className="px-4 py-3">Kolam Tambak</th>
                        <th className="px-4 py-3 text-center">Siklus</th>
                        <th className="px-4 py-3">Daftar Komoditas</th>
                        <th className="px-4 py-3 text-center">Mulai</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Total Modal</th>
                        <th className="px-4 py-3 text-right">Pendapatan</th>
                        <th className="px-4 py-3 text-right">Laba / Rugi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {reportData.siklus.map((s, idx) => {
                        const benurCost = reportData.benur.filter(b => b.siklus_id === s.siklus_id).reduce((sum, item) => sum + Number(item.total_harga || 0), 0);
                        const opsCost = reportData.operasional.filter(o => o.siklus_id === s.siklus_id).reduce((sum, item) => sum + Number(item.nominal || 0), 0);
                        const modal = benurCost + opsCost;
                        const revenue = reportData.panen.filter(p => p.siklus_id === s.siklus_id).reduce((sum, item) => sum + Number(item.pendapatan || 0), 0);
                        const laba = revenue - modal;
                        const sKomoditasNames = Array.from(new Set(reportData.komoditas.filter(k => k.siklus_id === s.siklus_id).map(k => k.nama_komoditas).filter(Boolean)));

                        return (
                          <tr key={s.siklus_id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3 text-center font-bold text-slate-500">{idx + 1}</td>
                            <td className="px-4 py-3 font-bold text-slate-900">{getTambakName(s.tambak_id)}</td>
                            <td className="px-4 py-3 text-center font-bold text-blue-600">#{s.nomor_siklus}</td>
                            <td className="px-4 py-3 font-medium text-slate-700">{sKomoditasNames.join(", ") || "Udang Vaname"}</td>
                            <td className="px-4 py-3 text-center text-slate-500">{formatDate(s.tanggal_mulai)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                                s.status === "aktif" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                              }`}>
                                {s.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-medium">{formatIDR(modal)}</td>
                            <td className="px-4 py-3 text-right font-medium text-emerald-700">{formatIDR(revenue)}</td>
                            <td className={`px-4 py-3 text-right font-black ${laba >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                              {formatIDR(laba)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 3: Detail Catatan Biaya & Panen */}
              {activeTab === "ops" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-blue-600 text-white font-semibold">
                      <tr>
                        <th className="px-4 py-3 text-center">Tanggal</th>
                        <th className="px-4 py-3">Komoditas</th>
                        <th className="px-4 py-3">Kategori</th>
                        <th className="px-4 py-3">Keterangan / Detail</th>
                        <th className="px-4 py-3 text-right">Nominal (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {[
                        ...reportData.benur.map(b => ({
                          tanggal: b.tanggal_tebar || b.tanggal,
                          komoditas: getKomoditasName(b.komoditas_id),
                          kategori: "Penebaran Bibit",
                          nominal: Number(b.total_harga || 0),
                          ket: `Ukuran ${b.ukuran_PL || "-"} (${formatNumber(b.jumlah_benur)} unit)`
                        })),
                        ...reportData.operasional.map(o => ({
                          tanggal: o.tanggal || o.tanggal_operasional,
                          komoditas: getKomoditasName(o.komoditas_id),
                          kategori: o.kategori,
                          nominal: Number(o.nominal || 0),
                          ket: o.keterangan || "-"
                        }))
                      ]
                        .sort((a, b) => new Date(a.tanggal || 0).getTime() - new Date(b.tanggal || 0).getTime())
                        .map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3 text-center text-slate-500 font-medium">{formatDate(item.tanggal)}</td>
                            <td className="px-4 py-3 font-bold text-slate-800">{item.komoditas}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700">
                                {item.kategori}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{item.ket}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">{formatIDR(item.nominal)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Empty Preview State */
        <div className="rounded-3xl border-2 border-dashed border-slate-200 py-14 text-center bg-slate-50/40 px-4">
          <FileText className="h-12 w-12 text-blue-400 stroke-1 mx-auto mb-3" />
          <h3 className="text-base font-black text-slate-800">Klik "Proses Laporan" Di Atas</h3>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed mx-auto mt-1 font-medium">
            Pilih kolam tambak Anda di atas, lalu tekan tombol biru <strong>"Proses Laporan"</strong> untuk melihat pratinjau data dan mengunduh berkas PDF atau Excel.
          </p>
        </div>
      )}
    </div>
  );
}
