"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
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
  Layers
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
import { formatIDR, formatNumber, formatDate } from "@/lib/utils";
import { getCommodityConfig, COMMODITY_TYPES } from "@/lib/commodity-config";

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
  const [selectedKomoditas, setSelectedKomoditas] = useState<KomoditasItem | null>(null);
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
  const [newKomoditasStartDate, setNewKomoditasStartDate] = useState(new Date().toISOString().split("T")[0]);

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

      // Ambil nama tambak
      if (resTambak.ok) {
        const jsonTambak = await resTambak.json();
        const allTambaks = jsonTambak.data || [];
        const currentTambak = allTambaks.find((t: any) => t.tambak_id === currentCycle.tambak_id);
        if (currentTambak) setTambakName(currentTambak.nama_tambak);
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
      
      if (selectedKomoditas?.komoditas_id === komoditasToDelete.komoditas_id) {
        setSelectedKomoditas(null);
      }
      
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
        {selectedKomoditas ? (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSelectedKomoditas(null)} 
            className="rounded-xl border border-slate-150 hover:bg-slate-50 h-9 w-9"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
        ) : (
          <Link href="/siklus">
            <Button variant="ghost" size="icon" className="rounded-xl border border-slate-150 hover:bg-slate-50 h-9 w-9">
              <ArrowLeft className="h-4.5 w-4.5" />
            </Button>
          </Link>
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Siklus Budidaya</span>
            <span className="text-xs text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-500">{tambakName}</span>
            {selectedKomoditas && (
              <>
                <span className="text-xs text-slate-300">/</span>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{selectedKomoditas.nama_komoditas}</span>
              </>
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
            {tambakName} - Siklus #{cycle.nomor_siklus} {selectedKomoditas ? `(${selectedKomoditas.nama_komoditas})` : ""}
          </h2>
        </div>
      </div>

      {!selectedKomoditas ? (
        /* ==================== DASHBOARD UTAMA SIKLUS (GABUNGAN) ==================== */
        <div className="space-y-8">
          {/* Ringkasan Ringkas Global */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modal Total Tambak</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-black text-slate-950">{formatIDR(totalModal)}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  Bibit: {formatIDR(totalBenurCost)} | Ops: {formatIDR(totalOperasionalCost)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pendapatan Total Tambak</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-black text-slate-950">{formatIDR(totalRevenue)}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  Dari {panenLogs.length} kali panen
                </p>
              </CardContent>
            </Card>

            <Card className={`border-slate-100 shadow-sm ${labaBersih > 0 ? "bg-green-50/20" : labaBersih < 0 ? "bg-red-50/20" : ""}`}>
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Laba Total Tambak</CardDescription>
              </CardHeader>
              <CardContent>
                <p className={`text-lg font-black ${labaBersih > 0 ? "text-green-700" : labaBersih < 0 ? "text-red-700" : "text-slate-950"}`}>
                  {labaBersih >= 0 ? "+" : ""}{formatIDR(labaBersih)}
                </p>
                <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  labaBersih > 0 ? "bg-green-100 text-green-800" : labaBersih < 0 ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-800"
                }`}>
                  {labaBersih > 0 ? "Untung" : labaBersih < 0 ? "Rugi" : "Impas"}
                </span>
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jumlah Komoditas</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-black text-slate-950">{commodities.length} Komoditas</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  Tebar: {formatDate(cycle.tanggal_mulai)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* SECTION DAFTAR KOMODITAS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-950">Komoditas & Kultivan Aktif</h3>
                <p className="text-xs text-slate-500 mt-0.5">Pilih komoditas untuk masuk ke dashboard produksi khususnya.</p>
              </div>
              <Button 
                onClick={() => setIsAddKomoditasOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 font-semibold rounded-xl text-xs"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Tambah Komoditas
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
                  <Button 
                    onClick={() => setIsAddKomoditasOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 font-semibold rounded-xl text-xs mt-2"
                  >
                    <Plus className="mr-1.5 h-4 w-4" /> Tambah Komoditas Pertama
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {commodities.map((k) => {
                  // Cari modal dan pendapatan khusus komoditas ini
                  const kBenurCost = benurLogs.filter(b => b.komoditas_id === k.komoditas_id).reduce((sum, item) => sum + Number(item.total_harga || 0), 0);
                  const kOpsCost = operasionalLogs.filter(o => o.komoditas_id === k.komoditas_id).reduce((sum, item) => sum + Number(item.nominal || 0), 0);
                  const kModal = kBenurCost + kOpsCost;
                  const kRevenue = panenLogs.filter(p => p.komoditas_id === k.komoditas_id).reduce((sum, item) => sum + Number(item.pendapatan || 0), 0);
                  const kLaba = kRevenue - kModal;

                  return (
                    <Card key={k.komoditas_id} className="border-slate-100 hover:border-blue-200 transition-all shadow-sm hover:shadow-md flex flex-col justify-between group overflow-hidden">
                      <CardHeader className="pb-3 border-b border-slate-50/50 bg-slate-50/30 group-hover:bg-blue-50/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            k.jenis_komoditas === "udang" 
                              ? "bg-amber-100 text-amber-800" 
                              : k.jenis_komoditas === "rumput_laut" 
                              ? "bg-emerald-100 text-emerald-800" 
                              : k.jenis_komoditas === "ikan" || k.jenis_komoditas === "bandeng"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}>
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
                            className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <CardTitle className="text-base font-bold text-slate-900 mt-2">{k.nama_komoditas}</CardTitle>
                        <CardDescription className="text-[10px] text-slate-400">Dimulai sejak: {formatDate(k.tanggal_mulai)}</CardDescription>
                      </CardHeader>
                    
                    <CardContent className="py-4 space-y-3 text-xs flex-grow">
                      <div className="flex justify-between items-center text-slate-500 border-b border-slate-50 pb-2">
                        <span>Modal Awal:</span>
                        <span className="font-bold text-slate-800">{formatIDR(kModal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500 border-b border-slate-50 pb-2">
                        <span>Pendapatan:</span>
                        <span className="font-bold text-slate-800">{formatIDR(kRevenue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Laba Bersih:</span>
                        <span className={`font-black ${kLaba >= 0 ? "text-green-600" : "text-red-600"}`}>{formatIDR(kLaba)}</span>
                      </div>
                    </CardContent>

                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex gap-2">
                      <Button
                        onClick={() => setSelectedKomoditas(k)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-9 shadow-sm"
                      >
                        Masuk Dashboard
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
            )}
          </div>

          {/* Rincian Analisis Biaya Tambak (Gabungan) */}
          <Card className="border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4.5">
              <CardTitle className="text-sm font-bold text-slate-900">Analisis Rincian Biaya Pengeluaran Tambak</CardTitle>
              <CardDescription className="text-xs text-slate-400">Rincian alokasi pengeluaran gabungan seluruh komoditas pada siklus ini.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/30">
                  <TableRow className="border-b border-slate-100">
                    <TableHead className="font-bold text-slate-700 pl-6">Kategori Biaya</TableHead>
                    <TableHead className="font-bold text-slate-700">Persentase (%)</TableHead>
                    <TableHead className="text-right font-bold text-slate-700 pr-6">Jumlah Nominal</TableHead>
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
                        groupedCosts.push({
                          name: cat,
                          amount: amount
                        });
                      }
                    });

                    groupedCosts.sort((a, b) => b.amount - a.amount);

                    if (groupedCosts.length > 0) {
                      return groupedCosts.map((item) => {
                        const pct = totalModal > 0 ? ((item.amount / totalModal) * 100).toFixed(1) : "0.0";
                        return (
                          <TableRow key={item.name} className="border-b border-slate-50 hover:bg-slate-50/30">
                            <TableCell className={`pl-6 ${item.isSeed ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                              {item.name}
                            </TableCell>
                            <TableCell className="font-medium text-slate-500">{pct}%</TableCell>
                            <TableCell className={`text-right pr-6 ${item.isSeed ? "font-semibold text-slate-900" : "font-medium text-slate-800"}`}>{formatIDR(item.amount)}</TableCell>
                          </TableRow>
                        );
                      });
                    }

                    return (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-xs text-slate-400 font-semibold">
                          Belum ada pengeluaran yang dicatat.
                        </TableCell>
                      </TableRow>
                    );
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ==================== DASHBOARD KHUSUS KOMODITAS (KULTIVAN) ==================== */
        <div className="space-y-6">
          {/* Back Header */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setSelectedKomoditas(null)}
              variant="outline"
              size="sm"
              className="text-xs font-bold border-slate-150 text-slate-600 rounded-xl"
            >
              ← Kembali ke Ringkasan Siklus
            </Button>
          </div>

          {(() => {
            const kConfig = getCommodityConfig(selectedKomoditas.jenis_komoditas);
            
            // Perhitungan data khusus komoditas terpilih
            const kBenurs = benurLogs.filter(b => b.komoditas_id === selectedKomoditas.komoditas_id);
            const kOps = operasionalLogs.filter(o => o.komoditas_id === selectedKomoditas.komoditas_id);
            const kPanens = panenLogs.filter(p => p.komoditas_id === selectedKomoditas.komoditas_id);
            
            const kBenurCost = kBenurs.reduce((sum, b) => sum + Number(b.total_harga || 0), 0);
            const kOpsCost = kOps.reduce((sum, o) => sum + Number(o.nominal || 0), 0);
            const kModal = kBenurCost + kOpsCost;
            const kRevenue = kPanens.reduce((sum, p) => sum + Number(p.pendapatan || 0), 0);
            const kLaba = kRevenue - kModal;

            const totalSeeds = kBenurs.reduce((sum, b) => sum + Number(b.jumlah_benur || 0), 0);
            const totalHarvestWeight = kPanens.reduce((sum, p) => sum + Number(p.berat_panen || 0), 0);

            return (
              <div className="space-y-6">
                {/* Parameter-parameter Dashboard Komoditas */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Card 1: Stocking Seed / Seedlings */}
                  <Card className="border-slate-100 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kConfig.stockingQtyLabel}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-black text-slate-950">{formatNumber(totalSeeds)} {kConfig.stockingQtyUnit}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        Biaya Bibit: {formatIDR(kBenurCost)}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Card 2: Harvest */}
                  <Card className="border-slate-100 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kConfig.harvestWeightLabel}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-black text-slate-950">{formatNumber(totalHarvestWeight)} kg</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        Pendapatan Jual: {formatIDR(kRevenue)}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Card 3: Modal */}
                  <Card className="border-slate-100 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modal Produksi</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-black text-slate-950">{formatIDR(kModal)}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        Bibit: {formatIDR(kBenurCost)} | Ops: {formatIDR(kOpsCost)}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Card 4: Profit */}
                  <Card className={`border-slate-100 shadow-sm ${kLaba >= 0 ? "bg-green-50/25" : "bg-red-50/25"}`}>
                    <CardHeader className="pb-2">
                      <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Laba Bersih Komoditas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-lg font-black ${kLaba >= 0 ? "text-green-700" : "text-red-700"}`}>{formatIDR(kLaba)}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        Margin: {kRevenue > 0 ? ((kLaba / kRevenue) * 100).toFixed(1) : "0"}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* MODUL PRODUKSI KOMODITAS (TABS LIST) */}
                <Tabs defaultValue="benur" className="w-full">
                  <TabsList className="w-full justify-start rounded-xl bg-slate-100/70 p-1 mb-6 border border-slate-150/20 h-auto overflow-x-auto flex whitespace-nowrap">
                    <TabsTrigger value="benur" className="rounded-lg px-4 py-2 text-xs font-bold transition-all">
                      {kConfig.stockingLabel}
                    </TabsTrigger>
                    <TabsTrigger value="sampling" className="rounded-lg px-4 py-2 text-xs font-bold transition-all">
                      {kConfig.growthLabel}
                    </TabsTrigger>
                    <TabsTrigger value="panen" className="rounded-lg px-4 py-2 text-xs font-bold transition-all">
                      {kConfig.harvestLabel}
                    </TabsTrigger>
                    <TabsTrigger value="operasional" className="rounded-lg px-4 py-2 text-xs font-bold transition-all">
                      Biaya Operasional
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="benur" className="focus-visible:outline-none">
                    <CycleBenur 
                      siklusId={cycle.siklus_id} 
                      isCycleActive={cycle.status === "aktif" && selectedKomoditas.status === "aktif"} 
                      komoditasId={selectedKomoditas.komoditas_id}
                      jenisKomoditas={selectedKomoditas.jenis_komoditas}
                      namaKomoditas={selectedKomoditas.nama_komoditas}
                    />
                  </TabsContent>

                  <TabsContent value="sampling" className="focus-visible:outline-none">
                    <CycleSampling 
                      siklusId={cycle.siklus_id} 
                      isCycleActive={cycle.status === "aktif" && selectedKomoditas.status === "aktif"} 
                      komoditasId={selectedKomoditas.komoditas_id}
                      jenisKomoditas={selectedKomoditas.jenis_komoditas}
                    />
                  </TabsContent>

                  <TabsContent value="panen" className="focus-visible:outline-none">
                    <CyclePanen 
                      siklusId={cycle.siklus_id} 
                      isCycleActive={cycle.status === "aktif" && selectedKomoditas.status === "aktif"} 
                      komoditasId={selectedKomoditas.komoditas_id}
                      jenisKomoditas={selectedKomoditas.jenis_komoditas}
                    />
                  </TabsContent>

                  <TabsContent value="operasional" className="focus-visible:outline-none">
                    <CycleOperasional 
                      siklusId={cycle.siklus_id} 
                      isCycleActive={cycle.status === "aktif" && selectedKomoditas.status === "aktif"} 
                      komoditasId={selectedKomoditas.komoditas_id}
                      jenisKomoditas={selectedKomoditas.jenis_komoditas}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            );
          })()}
        </div>
      )}

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
