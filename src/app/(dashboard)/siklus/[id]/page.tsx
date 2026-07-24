"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ArrowRight,
  Loader2, 
  Activity, 
  FileText, 
  DollarSign, 
  Scale, 
  CheckCircle,
  Plus,
  Trash2,
  Edit,
  Sprout,
  HelpCircle,
  TrendingUp,
  Percent,
  Layers,
  Fish,
  Banknote,
  BarChart2,
  Calculator
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ConfirmDialog from "@/components/shared/confirm-dialog";

import CycleBenur from "@/components/siklus/cycle-benur";
import CycleOperasional from "@/components/siklus/cycle-operasional";
import CycleSampling from "@/components/siklus/cycle-sampling";
import CyclePanen from "@/components/siklus/cycle-panen";
import { formatIDR, formatNumber, formatDate, getTodayDateString } from "@/lib/utils";
import { getCommodityConfig, COMMODITY_TYPES } from "@/lib/commodity-config";
import { usePokdakan } from "@/context/pokdakan-context";

interface SiklusItem {
  siklus_id: string;
  tambak_id: string;
  user_id: string;
  nomor_siklus: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: string;
}

interface KomoditasItem {
  komoditas_id: string;
  siklus_id: string;
  user_id: string;
  nama_komoditas: string;
  jenis_komoditas: string;
  tanggal_mulai: string;
  status: string;
}

export default function SiklusDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [cycle, setCycle] = useState<SiklusItem | null>(null);
  const [tambakName, setTambakName] = useState("Kolam");
  const [commodities, setCommodities] = useState<KomoditasItem[]>([]);
  const [cycleTab, setCycleTab] = useState<"komoditas" | "pengeluaran">("komoditas");
  const [isLoading, setIsLoading] = useState(true);


  // States untuk pembukuan keuangan global
  const [benurLogs, setBenurLogs] = useState<any[]>([]);
  const [operasionalLogs, setOperasionalLogs] = useState<any[]>([]);
  const [panenLogs, setPanenLogs] = useState<any[]>([]);

  // Dialog controllers
  const [isAddKomoditasOpen, setIsAddKomoditasOpen] = useState(false);
  const [isDeleteKomoditasOpen, setIsDeleteKomoditasOpen] = useState(false);
  const [komoditasToDelete, setKomoditasToDelete] = useState<KomoditasItem | null>(null);
  const [isSubmittingKomoditas, setIsSubmittingKomoditas] = useState(false);

  // Form state komoditas baru
  const [newKomoditasName, setNewKomoditasName] = useState("");
  const [newKomoditasType, setNewKomoditasType] = useState("udang");
  const [newKomoditasStartDate, setNewKomoditasStartDate] = useState(getTodayDateString());

  const { selectContext, anggotaList } = usePokdakan();

  useEffect(() => {
    fetchCycleData();
  }, [id]);

  const fetchCycleData = async () => {
    setIsLoading(true);
    try {
      // Ambil detail seluruh modul secara paralel untuk real-time data
      const [resSiklus, resTambak, resBenur, resOperasional, resPanen, resKomoditas] = await Promise.all([
        fetch("/api/siklus"),
        fetch("/api/tambak"),
        fetch(`/api/benur?siklusId=${id}`),
        fetch(`/api/operasional?siklusId=${id}`),
        fetch(`/api/panen?siklusId=${id}`),
        fetch(`/api/komoditas?siklusId=${id}`),
      ]);

      if (!resSiklus.ok) throw new Error("Gagal mengambil data siklus");
      const jsonSiklus = await resSiklus.json();
      const allCycles = jsonSiklus.data || [];
      const currentCycle = allCycles.find((c: any) => c.siklus_id === id);

      if (!currentCycle) {
        toast.error("Siklus tidak ditemukan");
        router.push("/siklus");
        return;
      }
      setCycle(currentCycle);

      // Ambil nama tambak & sync active context
      if (resTambak.ok) {
        const jsonTambak = await resTambak.json();
        const allTambaks = jsonTambak.data || [];
        const currentTambak = allTambaks.find((t: any) => t.tambak_id === currentCycle.tambak_id);
        if (currentTambak) {
          setTambakName(currentTambak.nama_tambak);
          const owner = anggotaList.find((a) => a.anggota_id === currentTambak.anggota_id);
          selectContext(owner || null, currentTambak);
        }
      }

      // Ambil riwayat benur, ops, panen
      if (resBenur.ok) setBenurLogs((await resBenur.json()).data || []);
      if (resOperasional.ok) setOperasionalLogs((await resOperasional.json()).data || []);
      if (resPanen.ok) setPanenLogs((await resPanen.json()).data || []);

       // Ambil komoditas aktif
      if (resKomoditas.ok) {
        const komoditasData = (await resKomoditas.json()).data || [];
        setCommodities(komoditasData);
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat detail siklus");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKomoditas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKomoditasName.trim()) {
      toast.error("Nama komoditas wajib diisi");
      return;
    }

    setIsSubmittingKomoditas(true);
    try {
      const res = await fetch(`/api/komoditas?siklusId=${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_komoditas: newKomoditasName,
          jenis_komoditas: newKomoditasType,
          tanggal_mulai: newKomoditasStartDate,
          status: "aktif"
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menambahkan komoditas");

      toast.success("Komoditas baru berhasil ditambahkan!");
      setIsAddKomoditasOpen(false);
      setNewKomoditasName("");
      setNewKomoditasType("udang");
      fetchCycleData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan komoditas");
    } finally {
      setIsSubmittingKomoditas(false);
    }
  };

  const handleDeleteKomoditasConfirm = async () => {
    if (!komoditasToDelete) return;
    setIsSubmittingKomoditas(true);
    try {
      // Jika menghapus komoditas default virtual, kita hanya reload halaman
      if (komoditasToDelete.komoditas_id === "default-udang") {
        toast.error("Tidak dapat menghapus komoditas bawaan data lama");
        setIsDeleteKomoditasOpen(false);
        setKomoditasToDelete(null);
        return;
      }

      const res = await fetch(`/api/komoditas/${komoditasToDelete.komoditas_id}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menghapus komoditas");

      toast.success("Komoditas beserta log produksinya berhasil dihapus!");
      setIsDeleteKomoditasOpen(false);
      setKomoditasToDelete(null);
      
      fetchCycleData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus komoditas");
    } finally {
      setIsSubmittingKomoditas(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-500">Memuat detail siklus...</p>
        </div>
      </div>
    );
  }

  if (!cycle) return null;

  // Keuangan Global Tingkat Siklus
  const totalBenurCost = benurLogs.reduce((sum, item) => sum + Number(item.total_harga || 0), 0);
  const totalOperasionalCost = operasionalLogs.reduce((sum, item) => sum + Number(item.nominal || 0), 0);
  const totalModal = totalBenurCost + totalOperasionalCost;
  const totalRevenue = panenLogs.reduce((sum, item) => sum + Number(item.pendapatan || 0), 0);
  const labaBersih = totalRevenue - totalModal;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <Link href="/siklus">
          <Button variant="ghost" size="icon" className="rounded-xl border border-slate-150 hover:bg-slate-50 h-9 w-9">
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Siklus Budidaya</span>
            <span className="text-xs text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-500">{tambakName}</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
            {tambakName} - Siklus #{cycle.nomor_siklus}
          </h2>
        </div>
      </div>

      <div className="space-y-8">
          {/* Ringkasan Ringkas Global */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Modal Total Tambak</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <DollarSign className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-black text-slate-900">{formatIDR(totalModal)}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Bibit: {formatIDR(totalBenurCost)} | Ops: {formatIDR(totalOperasionalCost)}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pendapatan Total</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-black text-slate-900">{formatIDR(totalRevenue)}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Dari {panenLogs.length} kali panen
                </p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Laba Total Tambak</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Scale className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-black ${labaBersih >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {labaBersih >= 0 ? "+" : ""}{formatIDR(labaBersih)}
                </p>
                <span className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  labaBersih > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : labaBersih < 0 ? "bg-red-50 text-red-700 border border-red-200" : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}>
                  {labaBersih > 0 ? "Untung" : labaBersih < 0 ? "Rugi" : "Impas"}
                </span>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jumlah Komoditas</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Sprout className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-black text-slate-900">{commodities.length} <span className="text-sm font-bold text-slate-500">Kultivan</span></p>
                <p className="text-xs text-slate-400 mt-1">
                  Tebar: {formatDate(cycle.tanggal_mulai)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main View Segmented Switcher (Komoditas vs Biaya Operasional) */}
          <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex w-full gap-1.5">
              <button
                type="button"
                onClick={() => setCycleTab("komoditas")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold transition-all ${
                  cycleTab === "komoditas"
                    ? "bg-white text-blue-700 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:bg-slate-200/60"
                }`}
              >
                <Sprout className="h-4 w-4 text-blue-600 shrink-0" />
                <span>Komoditas &amp; Kultivan Aktif</span>
              </button>

              <button
                type="button"
                onClick={() => setCycleTab("pengeluaran")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold transition-all ${
                  cycleTab === "pengeluaran"
                    ? "bg-white text-blue-700 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:bg-slate-200/60"
                }`}
              >
                <Calculator className="h-4 w-4 text-slate-500 shrink-0" />
                <span>Biaya &amp; Pengeluaran Siklus</span>
              </button>
            </div>
          </div>

          {/* TAB 1: SECTION DAFTAR KOMODITAS */}
          {cycleTab === "komoditas" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-950">Komoditas &amp; Kultivan Aktif</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Pilih komoditas untuk masuk ke dashboard produksi khususnya.</p>
                </div>
                <Button 
                  onClick={() => setIsAddKomoditasOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl text-xs h-10 px-4 text-white shadow-2xs gap-1.5 shrink-0"
                >
                  <Plus className="h-4 w-4" /> Tambah Komoditas
                </Button>
              </div>

              {commodities.length === 0 ? (
                <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 p-8 text-center rounded-2xl shadow-none">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Plus className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Belum Ada Komoditas Ditambahkan</h4>
                      <p className="text-xs text-slate-500 max-w-md mt-1">
                        Siklus ini belum memiliki komoditas yang didaftarkan. Tambahkan komoditas pertama Anda (seperti Udang, Ikan, Rumput Laut, Kepiting, dll.) untuk mulai mencatat budidaya.
                      </p>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(() => {
                    const generalOpsCost = operasionalLogs.filter(o => !o.komoditas_id || o.komoditas_id === "").reduce((sum, item) => sum + Number(item.nominal || 0), 0);
                    const activeCount = commodities.length || 1;
                    const sharedOpsCost = generalOpsCost / activeCount;

                    return commodities.map((k) => {
                      const kBenurCost = benurLogs.filter(b => b.komoditas_id === k.komoditas_id).reduce((sum, item) => sum + Number(item.total_harga || 0), 0);
                      const kOpsDirectCost = operasionalLogs.filter(o => o.komoditas_id === k.komoditas_id).reduce((sum, item) => sum + Number(item.nominal || 0), 0);
                      const kOpsCost = kOpsDirectCost + sharedOpsCost;
                      const kModal = kBenurCost + kOpsCost;
                      const kRevenue = panenLogs.filter(p => p.komoditas_id === k.komoditas_id).reduce((sum, item) => sum + Number(item.pendapatan || 0), 0);
                      const kLaba = kRevenue - kModal;

                      return (
                        <Card
                          key={k.komoditas_id}
                          className="transition-all shadow-2xs hover:shadow-md rounded-2xl p-4 flex flex-col justify-between bg-white border border-slate-200 hover:border-blue-300"
                        >
                          <div className="space-y-3">
                            {/* Header: Type Badge & Trash Action */}
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                                  k.jenis_komoditas === "udang"
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : k.jenis_komoditas === "rumput_laut"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : k.jenis_komoditas === "ikan" || k.jenis_komoditas === "bandeng"
                                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                                    : "bg-purple-100 text-purple-800 border border-purple-200"
                                }`}
                              >
                                {k.jenis_komoditas === "rumput_laut" ? "Rumput Laut" : k.jenis_komoditas}
                              </span>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setKomoditasToDelete(k);
                                  setIsDeleteKomoditasOpen(true);
                                }}
                                className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus Komoditas"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>

                            {/* Title & Start Date */}
                            <div className="space-y-2">
                              <h3 className="text-base font-bold text-slate-900 capitalize">
                                {k.nama_komoditas}
                              </h3>
                              <p className="text-[11px] text-slate-400 font-medium">
                                Mulai: {formatDate(k.tanggal_mulai)}
                              </p>

                              {/* Financial Metrics Compact Container */}
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100/80 text-xs space-y-1.5">
                                <div className="flex items-center justify-between text-slate-600">
                                  <span className="font-semibold text-slate-500">Modal Total:</span>
                                  <span className="font-bold text-slate-900">{formatIDR(kModal)}</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600 pt-1.5 border-t border-slate-200/50">
                                  <span className="font-semibold text-slate-500">Pendapatan:</span>
                                  <span className="font-bold text-slate-900">{formatIDR(kRevenue)}</span>
                                </div>
                                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/50">
                                  <span className="font-semibold text-slate-500">Laba Bersih:</span>
                                  <span className={`font-black ${kLaba >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                    {kLaba >= 0 ? "+" : ""}{formatIDR(kLaba)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Footer Action Button */}
                            <Link href={`/siklus/${id}/komoditas/${k.komoditas_id}`} className="w-full">
                              <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-10 px-4 shadow-2xs gap-1.5"
                              >
                                Masuk Dashboard <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                        </Card>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SECTION BIAYA PENGELUARAN + ANALISIS RINCIAN */}
          {cycleTab === "pengeluaran" && (
            <div className="animate-in fade-in duration-200">
              <Card className="border-slate-100 shadow-sm overflow-hidden">
                {/* Komponen Operasional: header, KPI total, dan tabel riwayat */}
                <div className="p-5 sm:p-6">
                  <CycleOperasional
                    siklusId={cycle.siklus_id}
                    isCycleActive={cycle.status === "aktif"}
                    komoditasId=""
                    onDataChange={fetchCycleData}
                  />
                </div>

                {/* Divider */}
                <div className="mx-5 sm:mx-6 border-t border-dashed border-slate-200" />

                {/* Analisis Rincian Biaya */}
                <div className="px-5 sm:px-6 py-5">
                  <div className="mb-4">
                    <p className="text-sm font-bold text-slate-800">Analisis Rincian Biaya Pengeluaran</p>
                    <p className="text-xs text-slate-400 mt-0.5">Rincian alokasi pengeluaran gabungan seluruh komoditas pada siklus ini.</p>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-100">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow className="border-b border-slate-100">
                          <TableHead className="font-bold text-slate-700 pl-4 py-3 text-xs">Kategori Biaya</TableHead>
                          <TableHead className="font-bold text-slate-700 py-3 text-xs">Persentase (%)</TableHead>
                          <TableHead className="text-right font-bold text-slate-700 pr-4 py-3 text-xs">Jumlah Nominal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const groupedCosts: { name: string; amount: number; isSeed?: boolean }[] = [];

                          if (totalBenurCost > 0) {
                            groupedCosts.push({
                              name: "Pembelian Bibit / Benur",
                              amount: totalBenurCost,
                              isSeed: true
                            });
                          }

                          const costByCategory = operasionalLogs.reduce((acc: Record<string, number>, item) => {
                            const cat = item.kategori || "Lainnya";
                            acc[cat] = (acc[cat] || 0) + Number(item.nominal || 0);
                            return acc;
                          }, {});

                          Object.entries(costByCategory).forEach(([cat, amount]) => {
                            if (amount > 0) {
                              groupedCosts.push({ name: cat, amount: amount });
                            }
                          });

                          groupedCosts.sort((a, b) => b.amount - a.amount);

                          if (groupedCosts.length > 0) {
                            return groupedCosts.map((item) => {
                              const pct = totalModal > 0 ? ((item.amount / totalModal) * 100).toFixed(1) : "0.0";
                              return (
                                <TableRow key={item.name} className="border-b border-slate-50 hover:bg-slate-50/40">
                                  <TableCell className={`pl-4 py-3 text-xs ${item.isSeed ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                                    {item.name}
                                  </TableCell>
                                  <TableCell className="text-xs font-medium text-slate-500 py-3">{pct}%</TableCell>
                                  <TableCell className={`text-right pr-4 py-3 text-xs ${item.isSeed ? "font-semibold text-slate-900" : "font-medium text-slate-800"}`}>
                                    {formatIDR(item.amount)}
                                  </TableCell>
                                </TableRow>
                              );
                            });
                          }

                          return (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-6 text-xs text-slate-400 font-semibold">
                                Belum ada pengeluaran yang dicatat.
                              </TableCell>
                            </TableRow>
                          );
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

      {/* dialogs */}

      {/* 1. Dialog Tambah Komoditas */}
      <Dialog open={isAddKomoditasOpen} onOpenChange={setIsAddKomoditasOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl border-slate-100 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Tambah Komoditas Baru</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Daftarkan komoditas baru untuk dibudidayakan dalam siklus ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddKomoditas} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="komoditas_name">Nama Komoditas / Kultivan</Label>
              <Input
                id="komoditas_name"
                placeholder="Misal: Udang Vaname, Rumput Laut Gracilaria, Bandeng"
                disabled={isSubmittingKomoditas}
                value={newKomoditasName}
                onChange={(e) => setNewKomoditasName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="komoditas_type">Jenis Komoditas</Label>
              <select
                id="komoditas_type"
                value={newKomoditasType}
                onChange={(e) => setNewKomoditasType(e.target.value)}
                disabled={isSubmittingKomoditas}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {COMMODITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="komoditas_start">Tanggal Mulai Budidaya</Label>
              <Input
                id="komoditas_start"
                type="date"
                disabled={isSubmittingKomoditas}
                value={newKomoditasStartDate}
                onChange={(e) => setNewKomoditasStartDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddKomoditasOpen(false)}
                disabled={isSubmittingKomoditas}
                className="rounded-xl font-semibold border-slate-150 text-slate-600 w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingKomoditas}
                className="rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                {isSubmittingKomoditas ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Tambah"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Dialog Hapus Komoditas */}
      <ConfirmDialog
        isOpen={isDeleteKomoditasOpen}
        onClose={() => {
          setIsDeleteKomoditasOpen(false);
          setKomoditasToDelete(null);
        }}
        onConfirm={handleDeleteKomoditasConfirm}
        title="Hapus Komoditas Budidaya?"
        description={`Apakah Anda yakin ingin menghapus komoditas "${komoditasToDelete?.nama_komoditas}" dari siklus ini? Tindakan ini akan menghapus seluruh data tebar, sampling, panen, dan pengeluaran terkait komoditas ini secara permanen dari spreadsheet Anda.`}
        isLoading={isSubmittingKomoditas}
      />
    </div>
  );
}
