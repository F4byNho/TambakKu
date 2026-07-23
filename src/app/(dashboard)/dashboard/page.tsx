"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  Users, 
  Layers, 
  Coins, 
  TrendingUp, 
  Activity, 
  ArrowRight,
  Plus,
  Loader2,
  Calendar,
  RotateCcw,
  CheckCircle2,
  Maximize2,
  BarChart3,
  MapPin,
  UserCheck,
  Phone
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatIDR, formatNumber, formatDate } from "@/lib/utils";
import { usePokdakan, type Anggota, type Tambak } from "@/context/pokdakan-context";
import { useRouter } from "next/navigation";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function DashboardPage() {
  const router = useRouter();
  const { 
    activeAnggota, 
    activeTambak, 
    anggotaList, 
    tambakList, 
    isLoading: isContextLoading, 
    selectContext, 
    clearActiveContext 
  } = usePokdakan();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Dialog state for selecting tambak when a member has > 1 tambak
  const [isSelectTambakOpen, setIsSelectTambakOpen] = useState(false);
  const [selectedMemberForModal, setSelectedMemberForModal] = useState<Anggota | null>(null);
  const [memberTambaksForModal, setMemberTambaksForModal] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [activeTambak, activeAnggota, tambakList]);

  const fetchDashboardData = async () => {
    setIsLoadingData(true);
    try {
      const url = activeTambak 
        ? `/api/dashboard?tambakId=${activeTambak.tambak_id}`
        : `/api/dashboard`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal memuat data dashboard");
      const json = await res.json();
      setDashboardData(json);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat data dashboard");
    } finally {
      setIsLoadingData(false);
    }
  };

  if (isContextLoading || isLoadingData) {
    return (
      <div className="flex h-[75vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-500">Memuat data Pokdakan &amp; Tambak...</p>
        </div>
      </div>
    );
  }

  const metrics = dashboardData?.metrics || {};

  // Total Luas Tambak
  const totalLuasAll = tambakList.reduce((sum, t) => sum + Number(t.luas_tambak || 0), 0);

  // ─── KONDISI 1: DASHBOARD PERSONAL (Context Mode per Anggota / Tambak) ───────
  if (activeAnggota || activeTambak) {
    const activeMemberTambaks = activeAnggota 
      ? tambakList.filter(t => t.anggota_id === activeAnggota.anggota_id)
      : [];

    return (
      <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
        {/* Banner Tambak Belum Ada (Jika anggota baru / 0 tambak) */}
        {!activeTambak && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/80 border border-amber-200/80 p-4 rounded-2xl shadow-2xs text-amber-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-bold shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold">{activeAnggota?.nama_anggota} Belum Memiliki Aset Tambak</h4>
                <p className="text-[11px] text-amber-700">Silakan daftarkan kolam/petak tambak pertama untuk anggota ini melalui menu Data Tambak.</p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/tambak")}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs h-10 px-4 shadow-2xs gap-1.5 shrink-0"
            >
              <Plus className="h-4 w-4" /> Tambah Tambak Pertama
            </Button>
          </div>
        )}

        {/* Quick Pindah Tambak Bar (Shown only if member owns > 1 tambak) */}
        {activeMemberTambaks.length > 1 && (
          <div className="flex items-center justify-between bg-blue-50/60 border border-blue-200/80 px-4 py-2.5 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Layers className="h-4 w-4 text-blue-600 shrink-0" />
              <span>Aset Tambak {activeAnggota?.nama_anggota}:</span>
              <span className="font-bold text-blue-700 capitalize">{activeTambak?.nama_tambak || "Pilih Tambak"}</span>
            </div>
            <Button
              onClick={() => {
                setSelectedMemberForModal(activeAnggota);
                setMemberTambaksForModal(activeMemberTambaks);
                setIsSelectTambakOpen(true);
              }}
              className="h-9 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-1.5 shadow-2xs shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Pindah Tambak
            </Button>
          </div>
        )}

        {/* Primary Metric: Luas Tambak & Financial KPI Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Luas Tambak (UTAMA) */}
          <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Luas Tambak (Utama)</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Maximize2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-black text-slate-900">
                {activeTambak ? activeTambak.luas_tambak.toLocaleString("id-ID") : 0}{" "}
                <span className="text-sm font-bold text-slate-500">m²</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                ({activeTambak ? (activeTambak.luas_tambak / 10000).toFixed(2) : "0.00"} Hektar)
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Total Modal Tambak */}
          <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Modal</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Coins className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-black text-slate-900">{formatIDR(metrics.totalModal || 0)}</p>
              <p className="text-xs text-slate-400 mt-1">Modal bibit &amp; operasional</p>
            </CardContent>
          </Card>

          {/* Card 3: Total Pendapatan Tambak */}
          <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pendapatan</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-black text-slate-900">{formatIDR(metrics.totalRevenue || 0)}</p>
              <p className="text-xs text-slate-400 mt-1">Hasil penjualan panen</p>
            </CardContent>
          </Card>

          {/* Card 4: Total Laba Bersih */}
          <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Keuntungan Bersih</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <BarChart3 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-black ${(metrics.totalLaba || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {formatIDR(metrics.totalLaba || 0)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Laba bersih tambak ini</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Nav Options */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border border-slate-200 shadow-2xs rounded-2xl hover:border-blue-300 transition-all p-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Siklus Budidaya</h4>
                  <p className="text-[11px] text-slate-500">Catat benur, sampling, &amp; panen</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => router.push("/siklus")} className="h-8 w-8 rounded-lg text-blue-600">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-2xs rounded-2xl hover:border-blue-300 transition-all p-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Pembukuan &amp; HPP</h4>
                  <p className="text-[11px] text-slate-500">Hitung HPP per KG &amp; margin</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => router.push("/pembukuan")} className="h-8 w-8 rounded-lg text-emerald-600">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-2xs rounded-2xl hover:border-blue-300 transition-all p-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Cetak Laporan</h4>
                  <p className="text-[11px] text-slate-500">Unduh PDF pencatatan tambak</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => router.push("/laporan")} className="h-8 w-8 rounded-lg text-purple-600">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>

        {/* POPUP DIALOG PILIH TAMBAK */}
        <Dialog open={isSelectTambakOpen} onOpenChange={setIsSelectTambakOpen}>
          <DialogContent className="sm:max-w-[440px] rounded-2xl border-slate-100 shadow-xl p-5">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                Pilih Tambak ({selectedMemberForModal?.nama_anggota})
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {selectedMemberForModal?.nama_anggota} memiliki {memberTambaksForModal.length} aset tambak. Pilih tambak yang ingin Anda lihat ringkasan budidayanya:
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2.5 pt-2">
              {memberTambaksForModal.map((t: any) => {
                const isCurrentActive = (activeTambak as any)?.tambak_id === t.tambak_id;
                return (
                  <div
                    key={t.tambak_id}
                    onClick={() => {
                      selectContext(selectedMemberForModal, t);
                      setIsSelectTambakOpen(false);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isCurrentActive 
                        ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20" 
                        : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-xs shrink-0 ${
                        isCurrentActive ? "bg-blue-600 text-white" : "bg-blue-50 border border-blue-100 text-blue-600"
                      }`}>
                        <Layers className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 capitalize truncate">{t.nama_tambak}</h4>
                        <p className="text-xs text-slate-500 font-medium">
                          Luas: {Number(t.luas_tambak || 0).toLocaleString("id-ID")} m² {t.lokasi ? `• ${t.lokasi}` : ""}
                        </p>
                      </div>
                    </div>

                    <Button size="sm" className="h-9 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3 gap-1 shrink-0">
                      {isCurrentActive ? "Aktif" : "Pilih"} <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── KONDISI 2: DASHBOARD POKDAKAN OVERVIEW (Semua Anggota & Tambak) ──────────
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Top Header Title */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900">Ringkasan Pokdakan</h2>
        <p className="text-xs text-slate-500 font-normal">
          Pilih anggota dan tambak di bawah ini untuk mulai mengelola aktivitas budidaya.
        </p>
      </div>

      {/* Pokdakan Summary KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Total Anggota */}
        <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Anggota</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-slate-900">{anggotaList.length} <span className="text-sm font-bold text-slate-500">Orang</span></p>
            <p className="text-xs text-slate-400 mt-1">Pembudidaya Pokdakan</p>
          </CardContent>
        </Card>

        {/* Metric 2: Total Tambak & Luas Total */}
        <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Luas Tambak</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Maximize2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-slate-900">{totalLuasAll.toLocaleString("id-ID")} <span className="text-sm font-bold text-slate-500">m²</span></p>
            <p className="text-xs text-slate-400 mt-1">{tambakList.length} Tambak terdaftar</p>
          </CardContent>
        </Card>

        {/* Metric 3: Total Modal Pokdakan */}
        <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Modal Pokdakan</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Coins className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-slate-900">{formatIDR(metrics.totalModal || 0)}</p>
            <p className="text-xs text-slate-400 mt-1">Gabungan seluruh tambak</p>
          </CardContent>
        </Card>

        {/* Metric 4: Total Laba Pokdakan */}
        <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Laba Pokdakan</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-black ${(metrics.totalLaba || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatIDR(metrics.totalLaba || 0)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Keuntungan kumulatif</p>
          </CardContent>
        </Card>
      </div>

      {/* SECTION PILIH ANGGOTA POKDAKAN (Standalone Card Grid) */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" /> Pilih Anggota Pokdakan
        </h3>

        {anggotaList.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {anggotaList.map((anggota) => {
              const memberTambaks = tambakList.filter((t) => t.anggota_id === anggota.anggota_id);
              const memberLuas = memberTambaks.reduce((sum, t) => sum + Number(t.luas_tambak || 0), 0);

              return (
                <Card
                  key={anggota.anggota_id}
                  onClick={() => {
                    if (memberTambaks.length === 0) {
                      selectContext(anggota, null);
                      router.push("/dashboard");
                    } else if (memberTambaks.length === 1) {
                      selectContext(anggota, memberTambaks[0]);
                    } else {
                      // Member has multiple tambaks! Open popup modal
                      setSelectedMemberForModal(anggota);
                      setMemberTambaksForModal(memberTambaks);
                      setIsSelectTambakOpen(true);
                    }
                  }}
                  className="transition-all shadow-2xs hover:shadow-md rounded-2xl p-4 flex flex-col justify-between bg-white border border-slate-200 hover:border-blue-300 cursor-pointer group"
                >
                  <div className="space-y-3">
                    {/* Header: Active Badge & Name */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserCheck className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                        <h4 className="text-base font-bold text-slate-900 capitalize truncate group-hover:text-blue-600 transition-colors">
                          {anggota.nama_anggota}
                        </h4>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Aktif
                      </span>
                    </div>

                    {/* Personal Info Box (Matching Gambar 2 on Data Anggota) */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                      {anggota.no_hp && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium">{anggota.no_hp}</span>
                        </div>
                      )}

                      {anggota.alamat && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate capitalize font-medium">{anggota.alamat}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 text-[11px]">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" /> Bergabung:
                        </span>
                        <span className="font-semibold text-slate-700">{formatDate(anggota.tanggal_bergabung)}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60">
                        <span className="text-slate-500 font-semibold flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5 text-blue-600" /> Aset Tambak:
                        </span>
                        <span className="font-extrabold text-blue-700">
                          {memberTambaks.length} Tambak ({memberLuas.toLocaleString("id-ID")} m²)
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border border-slate-200 p-8 text-center bg-white rounded-2xl shadow-2xs">
            <p className="text-xs text-slate-500 font-medium mb-3">Belum ada anggota Pokdakan yang didaftarkan.</p>
            <Button onClick={() => router.push("/anggota")} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-10 px-4 shadow-2xs gap-1.5">
              <Plus className="h-4 w-4" /> Tambah Anggota Pertama
            </Button>
          </Card>
        )}
      </div>

      {/* POPUP DIALOG PILIH TAMBAK */}
      <Dialog open={isSelectTambakOpen} onOpenChange={setIsSelectTambakOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl border-slate-100 shadow-xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              Pilih Tambak ({selectedMemberForModal?.nama_anggota})
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {selectedMemberForModal?.nama_anggota} memiliki {memberTambaksForModal.length} aset tambak. Pilih tambak yang ingin Anda lihat ringkasan budidayanya:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 pt-2">
            {memberTambaksForModal.map((t: any) => {
              const isCurrentActive = (activeTambak as any)?.tambak_id === t.tambak_id;
              return (
                <div
                  key={t.tambak_id}
                  onClick={() => {
                    selectContext(selectedMemberForModal, t);
                    setIsSelectTambakOpen(false);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isCurrentActive 
                      ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20" 
                      : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-xs shrink-0 ${
                      isCurrentActive ? "bg-blue-600 text-white" : "bg-blue-50 border border-blue-100 text-blue-600"
                    }`}>
                      <Layers className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 capitalize truncate">{t.nama_tambak}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Luas: {Number(t.luas_tambak || 0).toLocaleString("id-ID")} m² {t.lokasi ? `• ${t.lokasi}` : ""}
                      </p>
                    </div>
                  </div>

                  <Button size="sm" className="h-9 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3 gap-1 shrink-0">
                    {isCurrentActive ? "Aktif" : "Pilih"} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
