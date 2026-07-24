"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  Loader2, 
  Eye, 
  Coins,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils";
import HPPSection from "@/components/pembukuan/hpp-section";
import { usePokdakan } from "@/context/pokdakan-context";

interface CycleSummary {
  siklus_id: string;
  nama_tambak: string;
  nomor_siklus: number;
  modal: number;
  pendapatan: number;
  laba: number;
  status: string;
}

function PembukuanContent() {
  const searchParams = useSearchParams();
  const { activeTambak, activeAnggota } = usePokdakan();
  const initialTab = searchParams.get("tab") === "hpp" ? "hpp" : "pembukuan";

  const [activeTab, setActiveTab] = useState<"pembukuan" | "hpp">(initialTab);
  const [cycles, setCycles] = useState<CycleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const tab = searchParams.get("tab") === "hpp" ? "hpp" : "pembukuan";
    setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (value: "pembukuan" | "hpp") => {
    setActiveTab(value);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", value);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  };

  useEffect(() => {
    fetchLedgerData();
  }, [activeTambak, activeAnggota]);

  const fetchLedgerData = async () => {
    setIsLoading(true);
    try {
      const url = activeTambak 
        ? `/api/dashboard?tambakId=${activeTambak.tambak_id}`
        : activeAnggota
        ? `/api/dashboard?anggotaId=${activeAnggota.anggota_id}`
        : `/api/dashboard`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal mengambil data pembukuan");
      const json = await res.json();
      setCycles(json.cyclesSummary || []);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat buku besar");
    } finally {
      setIsLoading(false);
    }
  };

  const totalModalAll = cycles.reduce((sum, c) => sum + Number(c.modal || 0), 0);
  const totalRevenueAll = cycles.reduce((sum, c) => sum + Number(c.pendapatan || 0), 0);
  const totalLabaAll = totalRevenueAll - totalModalAll;
  const marginAll = totalRevenueAll > 0 ? (totalLabaAll / totalRevenueAll) * 100 : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Top Segmented Tab Control */}
      <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-2xs flex gap-2">
        <button
          onClick={() => handleTabChange("pembukuan")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition-all min-h-[44px] ${
            activeTab === "pembukuan"
              ? "bg-white text-blue-700 shadow-xs border border-blue-100"
              : "text-slate-600 hover:bg-slate-200/60"
          }`}
        >
          <Coins className="h-4 w-4" />
          Pembukuan &amp; Arus Kas
        </button>

        <button
          onClick={() => handleTabChange("hpp")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition-all min-h-[44px] ${
            activeTab === "hpp"
              ? "bg-white text-blue-700 shadow-xs border border-blue-100"
              : "text-slate-600 hover:bg-slate-200/60"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          HPP &amp; Harga Jual
        </button>
      </div>

      {activeTab === "hpp" ? (
        <HPPSection />
      ) : (
        <>
          {/* Header Banner */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 text-slate-900 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Pembukuan Keuangan Tambak</h3>
                <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                  Rekapitulasi gabungan modal pengeluaran vs total uang masuk dari hasil penjualan panen.
                </p>
              </div>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Modal Pengeluaran</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-black text-slate-900">{formatIDR(totalModalAll)}</p>
                <p className="text-xs text-slate-400 mt-1">Modal seluruh siklus</p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hasil Jual Panen</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-black text-slate-900">{formatIDR(totalRevenueAll)}</p>
                <p className="text-xs text-slate-400 mt-1">Pendapatan seluruh panen</p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Keuntungan Bersih</CardDescription>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-black ${totalLabaAll > 0 ? "text-emerald-600" : totalLabaAll < 0 ? "text-red-600" : "text-slate-900"}`}>
                  {totalLabaAll >= 0 ? "+" : ""}{formatIDR(totalLabaAll)}
                </p>
                <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                  totalLabaAll > 0 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                    : totalLabaAll < 0 
                    ? "bg-red-50 text-red-700 border border-red-200" 
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}>
                  {totalLabaAll > 0 ? "Untung" : totalLabaAll < 0 ? "Rugi" : "Impas"}
                </span>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Persentase Keuntungan</CardDescription>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-black ${marginAll > 0 ? "text-emerald-600" : marginAll < 0 ? "text-red-600" : "text-slate-900"}`}>
                  {marginAll.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-400 mt-1">Persentase laba dari penjualan</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Ledger Table */}
          <Card className="border-slate-100 shadow-sm">
            {isLoading ? (
              <div className="flex h-60 items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
                  <p className="text-xs text-slate-500 font-semibold">Memuat buku besar keuangan...</p>
                </div>
              </div>
            ) : cycles.length > 0 ? (
              <div className="p-4 sm:p-6 flex flex-col gap-4">
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="border-b border-slate-100">
                        <TableHead className="font-bold text-slate-700">Tambak / Kolam</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-slate-700">Siklus</TableHead>
                        <TableHead className="w-[110px] text-center font-bold text-slate-700">Status</TableHead>
                        <TableHead className="w-[150px] text-center font-bold text-slate-700">Total Modal</TableHead>
                        <TableHead className="w-[160px] text-center font-bold text-slate-700">Total Pendapatan</TableHead>
                        <TableHead className="w-[160px] text-center font-bold text-slate-700">Laba / Rugi Bersih</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-slate-700">Margin</TableHead>
                        <TableHead className="w-[180px] text-center font-bold text-slate-700">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cycles.map((item) => {
                        const itemMargin = item.pendapatan > 0 ? (item.laba / item.pendapatan) * 100 : 0;
                        return (
                          <TableRow key={item.siklus_id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <TableCell className="font-bold text-slate-900 py-3">
                              <div>{item.nama_tambak}</div>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {((item as any).komoditas && (item as any).komoditas.length > 0 ? (item as any).komoditas : ["Udang Vaname"]).map((kom: string, idx: number) => (
                                  <span key={idx} className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200/55 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                                    {kom}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-semibold text-slate-800">Siklus #{item.nomor_siklus}</TableCell>
                            <TableCell className="text-center">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                item.status === "aktif" 
                                  ? "bg-green-50 text-green-700" 
                                  : "bg-slate-100 text-slate-700"
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${item.status === "aktif" ? "bg-green-500" : "bg-slate-400"}`} />
                                {item.status === "aktif" ? "Aktif" : "Selesai"}
                              </span>
                            </TableCell>
                            <TableCell className="text-center font-medium text-slate-900">{formatIDR(item.modal)}</TableCell>
                            <TableCell className="text-center font-medium text-slate-900">{formatIDR(item.pendapatan)}</TableCell>
                            <TableCell className={`text-center font-bold ${item.laba > 0 ? "text-green-600" : item.laba < 0 ? "text-red-600" : "text-slate-900"}`}>
                              {item.laba > 0 ? "+" : ""}{formatIDR(item.laba)}
                            </TableCell>
                            <TableCell className={`text-center font-bold ${item.laba > 0 ? "text-green-600" : item.laba < 0 ? "text-red-600" : "text-slate-900"}`}>
                              {itemMargin.toFixed(1)}%
                            </TableCell>
                            <TableCell className="text-center">
                              <Link href={`/siklus/${item.siklus_id}`}>
                                <Button variant="outline" size="sm" className="h-8.5 rounded-xl border-slate-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold text-xs gap-1.5">
                                  <Eye className="h-3.5 w-3.5" /> Detail Pembukuan
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 shadow-inner">
                  <Coins className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Belum Ada Buku Besar</h3>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                  Buku besar keuangan akan otomatis terisi setelah Anda memulai siklus budidaya pertama kolam Anda dan melakukan pencatatan benur/operasional/panen.
                </p>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

export default function PembukuanPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[75vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-500">Memuat halaman pembukuan...</p>
        </div>
      </div>
    }>
      <PembukuanContent />
    </Suspense>
  );
}
