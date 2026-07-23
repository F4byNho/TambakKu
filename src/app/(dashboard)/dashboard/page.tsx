"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  Timer, 
  Coins, 
  TrendingUp, 
  Heart, 
  Scale, 
  Activity, 
  ArrowRight,
  Plus,
  Loader2,
  Calendar,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatIDR, formatNumber } from "@/lib/utils";

interface DashboardData {
  metrics: {
    totalTambak: number;
    activeSiklus: number;
    totalModal: number;
    totalRevenue: number;
    totalLaba: number;
    totalHarvestWeight: number;
    lastAbw: number;
    lastSize: number;
  };
  cyclesSummary: Array<{
    siklus_id: string;
    nama_tambak: string;
    nomor_siklus: number;
    modal: number;
    pendapatan: number;
    laba: number;
    status: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Gagal memuat data dashboard");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-500">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalTambak: 0,
    activeSiklus: 0,
    totalModal: 0,
    totalRevenue: 0,
    totalLaba: 0,
    totalHarvestWeight: 0,
    lastAbw: 0,
    lastSize: 0,
  };

  const cycles = data?.cyclesSummary || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="rounded-2xl bg-slate-900 p-5 md:p-6 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-2xl font-bold tracking-tight">
              Ringkasan Budidaya Tambak
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1 font-normal">
              Pantau statistik kolam, modal pengeluaran, perkembangan berat komoditas (kultivan), dan hasil panen Anda.
            </p>
          </div>
          <div className="flex shrink-0 w-full sm:w-auto">
            <Link href="/tambak" className="w-full sm:w-auto">
              <Button className="bg-blue-600 hover:bg-blue-700 font-bold text-xs sm:text-sm h-11 px-5 rounded-xl text-white w-full sm:w-auto">
                <Plus className="mr-1.5 h-4 w-4" /> Tambah Kolam Baru
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Tambak */}
        <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Jumlah Kolam
            </span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{metrics.totalTambak} <span className="text-xs font-normal text-slate-500">Kolam</span></div>
            <p className="text-xs text-slate-400 mt-1">Total kolam terdaftar</p>
          </CardContent>
        </Card>

        {/* Card 2: Siklus Aktif */}
        <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Siklus Berjalan
            </span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Timer className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-blue-700">{metrics.activeSiklus} <span className="text-xs font-normal text-slate-500">Siklus</span></div>
            <p className="text-xs text-slate-400 mt-1">Kolam aktif dibudidayakan</p>
          </CardContent>
        </Card>

        {/* Card 3: Total Modal */}
        <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Modal Produksi
            </span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <Coins className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{formatIDR(metrics.totalModal)}</div>
            <p className="text-xs text-slate-400 mt-1">Biaya bibit + operasional</p>
          </CardContent>
        </Card>

        {/* Card 4: Total Pendapatan */}
        <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Hasil Jual Panen
            </span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{formatIDR(metrics.totalRevenue)}</div>
            <p className="text-xs text-slate-400 mt-1">Pendapatan hasil panen</p>
          </CardContent>
        </Card>

        {/* Card 5: Laba Bersih */}
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
            <div className={`text-2xl font-black ${metrics.totalLaba >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatIDR(metrics.totalLaba)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Sisa untung setelah modal</p>
          </CardContent>
        </Card>

        {/* Card 6: ABW Terakhir */}
        <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rata-rata Berat (ABW)
            </span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <Heart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{formatNumber(metrics.lastAbw)} <span className="text-xs font-normal text-slate-500">gram</span></div>
            <p className="text-xs text-slate-400 mt-1">Berat rata-rata per sampel/ekor</p>
          </CardContent>
        </Card>

        {/* Card 7: Size Terakhir */}
        <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Isi per KG (Size)
            </span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <Scale className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{metrics.lastSize > 0 ? Math.round(metrics.lastSize) : 0} <span className="text-xs font-normal text-slate-500">ekor / unit / kg</span></div>
            <p className="text-xs text-slate-400 mt-1">Estimasi isi ekor/unit per 1 kg</p>
          </CardContent>
        </Card>

        {/* Card 8: Total Panen */}
        <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Hasil Panen
            </span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{formatNumber(metrics.totalHarvestWeight)} <span className="text-xs font-normal text-slate-500">KG</span></div>
            <p className="text-xs text-slate-400 mt-1">Total berat komoditas dipanen</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts & Side Columns */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chart Column: Pendapatan vs Modal */}
        <Card className="border border-slate-200 shadow-2xs lg:col-span-2 rounded-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">
              Grafik Modal vs Pendapatan
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Perbandingan total pengeluaran modal (kuning) dengan hasil penjualan panen (biru).
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {isMounted && cycles.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cycles} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="nama_tambak" stroke="#64748b" fontSize={11} tickLine={false} fontWeight={600} />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => {
                      if (value >= 1_000_000) {
                        return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")} jt`;
                      }
                      if (value >= 1_000) {
                        return `${(value / 1_000).toFixed(0)} rb`;
                      }
                      return value;
                    }}
                  />
                  <Tooltip 
                    formatter={(value: any) => formatIDR(Number(value))}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", fontWeight: 600 }} />
                  <Bar dataKey="modal" name="Total Modal Pengeluaran" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pendapatan" name="Total Hasil Jual Panen" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <Calendar className="h-8 w-8 mb-2 stroke-1 text-slate-400" />
                <p className="text-xs font-bold text-slate-600">Belum Ada Data Siklus Tambak</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Mulai buat siklus pertama di menu Siklus Budidaya</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side Panel: Quick Actions */}
        <div className="flex flex-col gap-6">
          <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                Menu Aksi Cepat
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Jalan pintas ke menu utama</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Link href="/tambak">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer group">
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Daftar Kolam Tambak</p>
                    <p className="text-[10px] text-slate-500">Kelola lokasi & ukuran m²</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </Link>

              <Link href="/siklus">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer group">
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Siklus & Catat Benur</p>
                    <p className="text-[10px] text-slate-500">Mulai sebar bibit & sampling</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </Link>

              <Link href="/pembukuan">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer group">
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Pembukuan Keuangan</p>
                    <p className="text-[10px] text-slate-500">Rekap modal & hasil jual</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </Link>

              <Link href="/laporan">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer group">
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Ekspor Laporan PDF/Excel</p>
                    <p className="text-[10px] text-slate-500">Cetak dokumen pembukuan</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
