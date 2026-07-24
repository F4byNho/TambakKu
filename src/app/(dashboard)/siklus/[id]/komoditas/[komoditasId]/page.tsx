"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Loader2, 
  Sprout, 
  Layers, 
  DollarSign, 
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import CycleBenur from "@/components/siklus/cycle-benur";
import CycleOperasional from "@/components/siklus/cycle-operasional";
import CycleSampling from "@/components/siklus/cycle-sampling";
import CyclePanen from "@/components/siklus/cycle-panen";
import { formatIDR, formatNumber, formatDate } from "@/lib/utils";
import { getCommodityConfig } from "@/lib/commodity-config";
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

function KomoditasDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const komoditasId = params.komoditasId as string;

  const [cycle, setCycle] = useState<SiklusItem | null>(null);
  const [tambakName, setTambakName] = useState("Kolam");
  const [selectedKomoditas, setSelectedKomoditas] = useState<KomoditasItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [benurLogs, setBenurLogs] = useState<any[]>([]);
  const [operasionalLogs, setOperasionalLogs] = useState<any[]>([]);
  const [panenLogs, setPanenLogs] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState("benur");

  const { selectContext, anggotaList } = usePokdakan();

  useEffect(() => {
    fetchData();
  }, [id, komoditasId]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["benur", "sampling", "panen", "operasional"].includes(tab)) {
      setActiveSubTab(tab);
    }
  }, [searchParams]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
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
        const match = komoditasData.find((k: any) => k.komoditas_id === komoditasId);
        if (!match) {
          toast.error("Komoditas tidak ditemukan");
          router.push(`/siklus/${id}`);
          return;
        }
        setSelectedKomoditas(match);
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat detail komoditas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveSubTab(value);
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("tab", value);
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.replaceState(null, "", newUrl);
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!cycle || !selectedKomoditas) return null;

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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <Link href={`/siklus/${id}`}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl border border-slate-150 hover:bg-slate-50 h-9 w-9"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Siklus Budidaya</span>
            <span className="text-xs text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-500">{tambakName}</span>
            <span className="text-xs text-slate-300">/</span>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{selectedKomoditas.nama_komoditas}</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
            {tambakName} - Siklus #{cycle.nomor_siklus} ({selectedKomoditas.nama_komoditas})
          </h2>
        </div>
      </div>

      <div className="space-y-6">
        {/* KPI Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Stocking Seed */}
          <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {kConfig.stockingQtyLabel}
              </span>
              <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                <Sprout className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-black text-slate-900">{formatNumber(totalSeeds)} <span className="text-xs font-normal text-slate-500">{kConfig.stockingQtyUnit}</span></p>
              <p className="text-xs text-slate-400 mt-1">
                Biaya Bibit: {formatIDR(kBenurCost)}
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Harvest Weight */}
          <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {kConfig.harvestWeightLabel}
              </span>
              <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                <Layers className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-black text-slate-900">{formatNumber(totalHarvestWeight)} <span className="text-xs font-normal text-slate-500">kg</span></p>
              <p className="text-xs text-slate-400 mt-1">
                Pendapatan Jual: {formatIDR(kRevenue)}
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Modal Produksi */}
          <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Modal Produksi
              </span>
              <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                <DollarSign className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-black text-slate-900">{formatIDR(kModal)}</p>
              <p className="text-xs text-slate-400 mt-1">
                Bibit: {formatIDR(kBenurCost)} | Ops: {formatIDR(kOpsCost)}
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Profit / Laba */}
          <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Keuntungan Bersih
              </span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-black ${kLaba >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatIDR(kLaba)}</p>
              <p className="text-xs text-slate-400 mt-1">
                Margin: {kRevenue > 0 ? ((kLaba / kRevenue) * 100).toFixed(1) : "0"}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Segmented Tab Control */}
        <Tabs value={activeSubTab} onValueChange={handleTabChange} className="w-full space-y-6">
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 bg-transparent p-0 w-full h-auto">
            <TabsTrigger
              value="benur"
              className="flex items-center justify-center rounded-2xl px-3 py-3.5 border-2 border-slate-200 bg-white text-slate-500 font-bold transition-all hover:border-blue-300 hover:text-slate-700 data-[state=active]:!bg-blue-50/90 data-[state=active]:!border-blue-400 data-[state=active]:!text-slate-900 data-[state=active]:shadow-xs text-xs sm:text-sm text-center leading-tight min-h-[48px]"
            >
              {kConfig.stockingLabel}
            </TabsTrigger>

            <TabsTrigger
              value="sampling"
              className="flex items-center justify-center rounded-2xl px-3 py-3.5 border-2 border-slate-200 bg-white text-slate-500 font-bold transition-all hover:border-blue-300 hover:text-slate-700 data-[state=active]:!bg-blue-50/90 data-[state=active]:!border-blue-400 data-[state=active]:!text-slate-900 data-[state=active]:shadow-xs text-xs sm:text-sm text-center leading-tight min-h-[48px]"
            >
              {kConfig.growthLabel}
            </TabsTrigger>

            <TabsTrigger
              value="panen"
              className="flex items-center justify-center rounded-2xl px-3 py-3.5 border-2 border-slate-200 bg-white text-slate-500 font-bold transition-all hover:border-blue-300 hover:text-slate-700 data-[state=active]:!bg-blue-50/90 data-[state=active]:!border-blue-400 data-[state=active]:!text-slate-900 data-[state=active]:shadow-xs text-xs sm:text-sm text-center leading-tight min-h-[48px]"
            >
              {kConfig.harvestLabel}
            </TabsTrigger>

            <TabsTrigger
              value="operasional"
              className="flex items-center justify-center rounded-2xl px-3 py-3.5 border-2 border-slate-200 bg-white text-slate-500 font-bold transition-all hover:border-blue-300 hover:text-slate-700 data-[state=active]:!bg-blue-50/90 data-[state=active]:!border-blue-400 data-[state=active]:!text-slate-900 data-[state=active]:shadow-xs text-xs sm:text-sm text-center leading-tight min-h-[48px]"
            >
              Biaya Pengeluaran
            </TabsTrigger>
          </TabsList>

          <TabsContent value="benur" className="focus-visible:outline-none">
            <CycleBenur 
              siklusId={cycle.siklus_id} 
              isCycleActive={cycle.status === "aktif" && selectedKomoditas.status === "aktif"} 
              komoditasId={selectedKomoditas.komoditas_id}
              jenisKomoditas={selectedKomoditas.jenis_komoditas}
              namaKomoditas={selectedKomoditas.nama_komoditas}
              onDataChange={fetchData}
            />
          </TabsContent>

          <TabsContent value="sampling" className="focus-visible:outline-none">
            <CycleSampling 
              siklusId={cycle.siklus_id} 
              isCycleActive={cycle.status === "aktif" && selectedKomoditas.status === "aktif"} 
              komoditasId={selectedKomoditas.komoditas_id}
              jenisKomoditas={selectedKomoditas.jenis_komoditas}
              onDataChange={fetchData}
            />
          </TabsContent>

          <TabsContent value="panen" className="focus-visible:outline-none">
            <CyclePanen 
              siklusId={cycle.siklus_id} 
              isCycleActive={cycle.status === "aktif" && selectedKomoditas.status === "aktif"} 
              komoditasId={selectedKomoditas.komoditas_id}
              jenisKomoditas={selectedKomoditas.jenis_komoditas}
              onDataChange={fetchData}
            />
          </TabsContent>

          <TabsContent value="operasional" className="focus-visible:outline-none">
            <CycleOperasional 
              siklusId={cycle.siklus_id} 
              isCycleActive={cycle.status === "aktif" && selectedKomoditas.status === "aktif"} 
              komoditasId={selectedKomoditas.komoditas_id}
              jenisKomoditas={selectedKomoditas.jenis_komoditas}
              onDataChange={fetchData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function KomoditasDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[75vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-500">Memuat detail komoditas...</p>
        </div>
      </div>
    }>
      <KomoditasDetailContent />
    </Suspense>
  );
}
