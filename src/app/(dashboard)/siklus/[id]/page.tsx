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
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CycleBenur from "@/components/siklus/cycle-benur";
import CycleOperasional from "@/components/siklus/cycle-operasional";
import CycleSampling from "@/components/siklus/cycle-sampling";
import CyclePanen from "@/components/siklus/cycle-panen";
import { formatIDR, formatNumber, formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SiklusItem {
  siklus_id: string;
  tambak_id: string;
  user_id: string;
  nomor_siklus: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: string;
}

export default function SiklusDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [cycle, setCycle] = useState<SiklusItem | null>(null);
  const [tambakName, setTambakName] = useState("Kolam");
  const [isLoading, setIsLoading] = useState(true);

  // States untuk pembukuan keuangan
  const [benurLogs, setBenurLogs] = useState<any[]>([]);
  const [operasionalLogs, setOperasionalLogs] = useState<any[]>([]);
  const [panenLogs, setPanenLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchCycleDetail();
  }, [id]);

  const fetchCycleDetail = async () => {
    setIsLoading(true);
    try {
      // Ambil detail seluruh modul secara paralel untuk real-time data
      const [resSiklus, resTambak, resBenur, resOperasional, resPanen] = await Promise.all([
        fetch("/api/siklus"),
        fetch("/api/tambak"),
        fetch(`/api/benur?siklusId=${id}`),
        fetch(`/api/operasional?siklusId=${id}`),
        fetch(`/api/panen?siklusId=${id}`),
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
        if (currentTambak) {
          setTambakName(currentTambak.nama_tambak);
        }
      }

      // Ambil riwayat benur
      if (resBenur.ok) {
        const jsonBenur = await resBenur.json();
        setBenurLogs(jsonBenur.data || []);
      }

      // Ambil riwayat operasional
      if (resOperasional.ok) {
        const jsonOperasional = await resOperasional.json();
        setOperasionalLogs(jsonOperasional.data || []);
      }

      // Ambil riwayat panen
      if (resPanen.ok) {
        const jsonPanen = await resPanen.json();
        setPanenLogs(jsonPanen.data || []);
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat detail siklus");
    } finally {
      setIsLoading(false);
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

      {/* Tabs Menu */}
      <Tabs defaultValue="ringkasan" className="w-full">
        <TabsList className="w-full justify-start rounded-xl bg-slate-100/70 p-1 mb-6 overflow-x-auto flex whitespace-nowrap h-auto border border-slate-150/20">
          <TabsTrigger value="ringkasan" className="rounded-lg px-4 py-2 text-xs font-bold transition-all">
            Ringkasan
          </TabsTrigger>
          <TabsTrigger value="benur" className="rounded-lg px-4 py-2 text-xs font-bold transition-all">
            Penebaran Benur
          </TabsTrigger>
          <TabsTrigger value="operasional" className="rounded-lg px-4 py-2 text-xs font-bold transition-all">
            Biaya Operasional
          </TabsTrigger>
          <TabsTrigger value="sampling" className="rounded-lg px-4 py-2 text-xs font-bold transition-all">
            Sampling
          </TabsTrigger>
          <TabsTrigger value="panen" className="rounded-lg px-4 py-2 text-xs font-bold transition-all">
            Panen
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Ringkasan */}
        <TabsContent value="ringkasan" className="focus-visible:outline-none space-y-6">
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold text-slate-900">Perkembangan Siklus</CardTitle>
              <CardDescription className="text-xs text-slate-400">Rincian status durasi dan kelangsungan siklus budidaya.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
                  <p className="text-base font-bold text-slate-900 capitalize mt-1 flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${cycle.status === "aktif" ? "bg-green-500 animate-pulse" : "bg-slate-400"}`} />
                    {cycle.status}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase">Mulai Tebar</p>
                  <p className="text-base font-bold text-slate-900 mt-1">{formatDate(cycle.tanggal_mulai)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase">Selesai/Panen</p>
                  <p className="text-base font-bold text-slate-900 mt-1">{formatDate(cycle.tanggal_selesai)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase">Estimasi Umur (DoC)</p>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    {(() => {
                      const start = new Date(cycle.tanggal_mulai);
                      const end = cycle.tanggal_selesai ? new Date(cycle.tanggal_selesai) : new Date();
                      const diffTime = Math.abs(end.getTime() - start.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return `${diffDays} Hari (DoC)`;
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buku Besar / Keuangan Siklus */}
          {(() => {
            const totalBenurCost = benurLogs.reduce((sum, item) => sum + Number(item.total_harga || 0), 0);
            const totalOperasionalCost = operasionalLogs.reduce((sum, item) => sum + Number(item.nominal || 0), 0);
            const totalModal = totalBenurCost + totalOperasionalCost;

            const totalRevenue = panenLogs.reduce((sum, item) => sum + Number(item.pendapatan || 0), 0);
            const labaBersih = totalRevenue - totalModal;
            const marginKeuntungan = totalRevenue > 0 ? (labaBersih / totalRevenue) * 100 : 0;

            const costByCategory = operasionalLogs.reduce((acc: Record<string, number>, item) => {
              const cat = item.kategori || "Lainnya";
              acc[cat] = (acc[cat] || 0) + Number(item.nominal || 0);
              return acc;
            }, {});

            return (
              <div className="space-y-6">
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-base font-bold text-slate-900">Pembukuan Keuangan</h3>
                  <p className="text-xs text-slate-500">Analisis laba rugi otomatis gabungan seluruh modul pengeluaran dan pendapatan.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Card 1: Modal */}
                  <Card className="border-slate-100 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Modal Usaha</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-black text-slate-950">{formatIDR(totalModal)}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        Benur: {formatIDR(totalBenurCost)} | Ops: {formatIDR(totalOperasionalCost)}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Card 2: Pendapatan */}
                  <Card className="border-slate-100 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pendapatan</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-black text-slate-950">{formatIDR(totalRevenue)}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        Dari {panenLogs.length} kali pencatatan panen
                      </p>
                    </CardContent>
                  </Card>

                  {/* Card 3: Laba/Rugi */}
                  <Card className={`border-slate-100 shadow-sm ${labaBersih > 0 ? "bg-green-50/20" : labaBersih < 0 ? "bg-red-50/20" : ""}`}>
                    <CardHeader className="pb-2">
                      <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Laba / Rugi Bersih</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-lg font-black ${labaBersih > 0 ? "text-green-700" : labaBersih < 0 ? "text-red-700" : "text-slate-950"}`}>
                        {labaBersih >= 0 ? "+" : ""}{formatIDR(labaBersih)}
                      </p>
                      <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        labaBersih > 0 
                          ? "bg-green-100 text-green-800" 
                          : labaBersih < 0 
                          ? "bg-red-100 text-red-800" 
                          : "bg-slate-100 text-slate-800"
                      }`}>
                        {labaBersih > 0 ? "Untung" : labaBersih < 0 ? "Rugi" : "Impas"}
                      </span>
                    </CardContent>
                  </Card>

                  {/* Card 4: Margin */}
                  <Card className="border-slate-100 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Margin Keuntungan</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-lg font-black ${marginKeuntungan > 0 ? "text-green-700" : marginKeuntungan < 0 ? "text-red-700" : "text-slate-950"}`}>
                        {marginKeuntungan.toFixed(1)}%
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        Persentase laba dari pendapatan
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Biaya per Kategori Breakdown */}
                <Card className="border-slate-100 shadow-sm overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4.5">
                    <CardTitle className="text-sm font-bold text-slate-900">Analisis Rincian Biaya Pengeluaran</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Rincian alokasi biaya pengeluaran per kategori secara terperinci.</CardDescription>
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
                          const groupedCosts: { name: string; amount: number; isBenur?: boolean }[] = [];

                          if (totalBenurCost > 0) {
                            groupedCosts.push({
                              name: "Penebaran Benur (Larva)",
                              amount: totalBenurCost,
                              isBenur: true
                            });
                          }

                          Object.entries(costByCategory).forEach(([cat, amount]) => {
                            if (amount > 0) {
                              groupedCosts.push({
                                name: cat,
                                amount: amount
                              });
                            }
                          });

                          // Sort by amount descending
                          groupedCosts.sort((a, b) => b.amount - a.amount);

                          if (groupedCosts.length > 0) {
                            return groupedCosts.map((item) => {
                              const pct = totalModal > 0 ? ((item.amount / totalModal) * 100).toFixed(1) : "0.0";
                              return (
                                <TableRow key={item.name} className="border-b border-slate-50 hover:bg-slate-50/30">
                                  <TableCell className={`pl-6 ${item.isBenur ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                                    {item.name}
                                  </TableCell>
                                  <TableCell className="font-medium text-slate-500">{pct}%</TableCell>
                                  <TableCell className={`text-right pr-6 ${item.isBenur ? "font-semibold text-slate-900" : "font-medium text-slate-800"}`}>{formatIDR(item.amount)}</TableCell>
                                </TableRow>
                              );
                            });
                          }

                          return (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-8 text-xs text-slate-400 font-semibold">
                                Belum ada pengeluaran yang dicatat untuk siklus ini.
                              </TableCell>
                            </TableRow>
                          );
                        })()}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            );
          })()}
        </TabsContent>

        {/* Tab 2: Benur */}
        <TabsContent value="benur" className="focus-visible:outline-none">
          <CycleBenur siklusId={cycle.siklus_id} isCycleActive={cycle.status === "aktif"} />
        </TabsContent>

        {/* Tab 3: Operasional */}
        <TabsContent value="operasional" className="focus-visible:outline-none">
          <CycleOperasional siklusId={cycle.siklus_id} isCycleActive={cycle.status === "aktif"} />
        </TabsContent>

        {/* Tab 4: Sampling */}
        <TabsContent value="sampling" className="focus-visible:outline-none">
          <CycleSampling siklusId={cycle.siklus_id} isCycleActive={cycle.status === "aktif"} />
        </TabsContent>

        {/* Tab 5: Panen */}
        <TabsContent value="panen" className="focus-visible:outline-none">
          <CyclePanen siklusId={cycle.siklus_id} isCycleActive={cycle.status === "aktif"} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
