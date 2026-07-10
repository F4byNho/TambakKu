"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Calculator, 
  Loader2, 
  ArrowUpRight, 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  Coins
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatIDR, formatNumber } from "@/lib/utils";

interface CycleSummary {
  siklus_id: string;
  nama_tambak: string;
  nomor_siklus: number;
  modal: number;
  pendapatan: number;
  laba: number;
  status: string;
}

export default function PembukuanPage() {
  const [cycles, setCycles] = useState<CycleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLedgerData();
  }, []);

  const fetchLedgerData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Gagal mengambil data pembukuan");
      const json = await res.json();
      setCycles(json.cyclesSummary || []);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat buku besar");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate cumulative stats across all cycles
  const totalModalAll = cycles.reduce((sum, c) => sum + Number(c.modal || 0), 0);
  const totalRevenueAll = cycles.reduce((sum, c) => sum + Number(c.pendapatan || 0), 0);
  const totalLabaAll = totalRevenueAll - totalModalAll;
  const marginAll = totalRevenueAll > 0 ? (totalLabaAll / totalRevenueAll) * 100 : 0;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Buku Besar Keuangan
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Neraca keuangan lengkap per siklus budidaya kolam tambak terdaftar.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Modal */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Modal Kumulatif</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-black text-slate-950">{formatIDR(totalModalAll)}</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Gabungan modal seluruh siklus</p>
          </CardContent>
        </Card>

        {/* Card 2: Total Pendapatan */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pendapatan Kumulatif</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-black text-slate-950">{formatIDR(totalRevenueAll)}</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Hasil total penjualan panen</p>
          </CardContent>
        </Card>

        {/* Card 3: Laba/Rugi Kumulatif */}
        <Card className={`border-slate-100 shadow-sm ${totalLabaAll > 0 ? "bg-green-50/20" : totalLabaAll < 0 ? "bg-red-50/20" : ""}`}>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Laba Bersih Kumulatif</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-black ${totalLabaAll > 0 ? "text-green-700" : totalLabaAll < 0 ? "text-red-700" : "text-slate-950"}`}>
              {totalLabaAll >= 0 ? "+" : ""}{formatIDR(totalLabaAll)}
            </p>
            <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              totalLabaAll > 0 
                ? "bg-green-100 text-green-800" 
                : totalLabaAll < 0 
                ? "bg-red-100 text-red-800" 
                : "bg-slate-100 text-slate-800"
            }`}>
              {totalLabaAll > 0 ? "Profit" : totalLabaAll < 0 ? "Loss" : "Impas"}
            </span>
          </CardContent>
        </Card>

        {/* Card 4: Margin Kumulatif */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rata-Rata Margin</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-black ${marginAll > 0 ? "text-green-700" : marginAll < 0 ? "text-red-700" : "text-slate-950"}`}>
              {marginAll.toFixed(1)}%
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Margin laba dari pendapatan</p>
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
                        <TableCell className="font-bold text-slate-900">{item.nama_tambak}</TableCell>
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
          /* Empty State */
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
    </div>
  );
}
