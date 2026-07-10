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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Selamat Datang di TambakKu 👋
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Pantau perkembangan budidaya udang vaname dan pembukuan keuangan Anda hari ini.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/tambak">
            <Button className="bg-blue-600 hover:bg-blue-700 font-semibold shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Tambah Tambak
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Tambak */}
        <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Jumlah Tambak
            </span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{metrics.totalTambak} Kolam</div>
            <p className="text-[10px] text-slate-500 mt-1">Tambak terdaftar aktif</p>
          </CardContent>
        </Card>

        {/* Card 2: Siklus Aktif */}
        <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Siklus Aktif
            </span>
            <div className="rounded-lg bg-green-50 p-2 text-green-600">
              <Timer className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{metrics.activeSiklus} Siklus</div>
            <p className="text-[10px] text-slate-500 mt-1">Siklus sedang berjalan</p>
          </CardContent>
        </Card>

        {/* Card 3: Total Modal */}
        <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Modal
            </span>
            <div className="rounded-lg bg-yellow-50 p-2 text-yellow-600">
              <Coins className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{formatIDR(metrics.totalModal)}</div>
            <p className="text-[10px] text-slate-500 mt-1">Biaya benur + operasional</p>
          </CardContent>
        </Card>

        {/* Card 4: Total Pendapatan */}
        <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pendapatan
            </span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{formatIDR(metrics.totalRevenue)}</div>
            <p className="text-[10px] text-slate-500 mt-1">Hasil panen terjual</p>
          </CardContent>
        </Card>

        {/* Card 5: Laba Bersih */}
        <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Laba Bersih
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-black ${metrics.totalLaba >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatIDR(metrics.totalLaba)}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Pendapatan - Modal</p>
          </CardContent>
        </Card>

        {/* Card 6: ABW Terakhir */}
        <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ABW Terakhir
            </span>
            <div className="rounded-lg bg-pink-50 p-2 text-pink-600">
              <Heart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{formatNumber(metrics.lastAbw)} g</div>
            <p className="text-[10px] text-slate-500 mt-1">Rata-rata berat udang</p>
          </CardContent>
        </Card>

        {/* Card 7: Size Terakhir */}
        <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Size Terakhir
            </span>
            <div className="rounded-lg bg-cyan-50 p-2 text-cyan-600">
              <Scale className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{metrics.lastSize > 0 ? Math.round(metrics.lastSize) : 0} ekor/kg</div>
            <p className="text-[10px] text-slate-500 mt-1">Ukuran isi udang per kg</p>
          </CardContent>
        </Card>

        {/* Card 8: Total Panen */}
        <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Panen
            </span>
            <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{formatNumber(metrics.totalHarvestWeight)} kg</div>
            <p className="text-[10px] text-slate-500 mt-1">Berat kotor hasil panen</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts & Side Columns */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chart Column: Pendapatan vs Modal */}
        <Card className="border-slate-100 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold">Analisis Keuangan per Siklus</CardTitle>
            <CardDescription>Perbandingan total modal (benur + biaya operasional) dengan hasil penjualan (pendapatan)</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {isMounted && cycles.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cycles} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="nama_tambak" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis 
                    stroke="#94a3b8" 
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
                    contentStyle={{ borderRadius: "12px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", fontWeight: 600 }} />
                  <Bar dataKey="modal" name="Total Modal" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pendapatan" name="Total Pendapatan" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-400">
                <Calendar className="h-8 w-8 mb-2 stroke-1" />
                <p className="text-xs">Belum ada data siklus untuk dianalisis</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side Panel: Quick Actions & Recent Activities */}
        <div className="flex flex-col gap-6">
          {/* Quick Action Container */}
          <Card className="border-slate-100 shadow-sm flex-1">
            <CardHeader>
              <CardTitle className="text-base font-bold">Aksi Cepat</CardTitle>
              <CardDescription>Jalan pintas pencatatan data budidaya</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Link href="/siklus">
                <Button variant="outline" className="w-full justify-start rounded-xl font-semibold hover:text-blue-600 hover:bg-blue-50 border-slate-100">
                  <ArrowUpRight className="mr-2 h-4 w-4 text-blue-600" />
                  Mulai Siklus Baru
                </Button>
              </Link>
              <Link href="/siklus">
                <Button variant="outline" className="w-full justify-start rounded-xl font-semibold hover:text-blue-600 hover:bg-blue-50 border-slate-100">
                  <ArrowUpRight className="mr-2 h-4 w-4 text-blue-600" />
                  Catat Penebaran Benur
                </Button>
              </Link>
              <Link href="/siklus">
                <Button variant="outline" className="w-full justify-start rounded-xl font-semibold hover:text-blue-600 hover:bg-blue-50 border-slate-100">
                  <ArrowUpRight className="mr-2 h-4 w-4 text-blue-600" />
                  Catat Biaya Operasional
                </Button>
              </Link>
              <Link href="/siklus">
                <Button variant="outline" className="w-full justify-start rounded-xl font-semibold hover:text-blue-600 hover:bg-blue-50 border-slate-100">
                  <ArrowUpRight className="mr-2 h-4 w-4 text-blue-600" />
                  Catat Sampling Mingguan
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity Container */}
          <Card className="border-slate-100 shadow-sm flex-1">
            <CardHeader>
              <CardTitle className="text-base font-bold">Aktivitas Terbaru</CardTitle>
              <CardDescription>Riwayat pengisian data terakhir Anda</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <Activity className="h-8 w-8 text-slate-300 stroke-1 mb-2" />
              <p className="text-xs text-slate-500 font-medium">Belum Ada Aktivitas</p>
              <p className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed mt-1">
                Catat data penebaran, operasional, sampling, atau panen di menu Siklus untuk melihat riwayat aktivitas di sini secara real-time.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
