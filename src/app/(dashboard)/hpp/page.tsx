"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calculator, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import HPPKomoditasCard, { HPPKomoditasData } from "@/components/hpp/hpp-komoditas-card";
import HPPTambakSummary from "@/components/hpp/hpp-tambak-summary";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tambak {
  tambak_id: string;
  nama_tambak: string;
  lokasi: string;
}

interface Siklus {
  siklus_id: string;
  tambak_id: string;
  nomor_siklus: number;
  status: string;
  tanggal_mulai: string;
}

interface HPPData {
  tambak: Tambak | null;
  siklus: Siklus | null;
  hppPerKomoditas: HPPKomoditasData[];
  rekapTambak: {
    totalModalTambak: number;
    totalPendapatanTambak: number;
    totalLabaTambak: number;
    totalProduksiTambak: number;
  };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HPPPage() {
  const [tambaks, setTambaks] = useState<Tambak[]>([]);
  const [siklus, setSiklus] = useState<Siklus[]>([]);
  const [selectedTambakId, setSelectedTambakId] = useState("");
  const [selectedSiklusId, setSelectedSiklusId] = useState("");
  const [hppData, setHppData] = useState<HPPData | null>(null);
  const [activeTab, setActiveTab] = useState<string>("rekap");

  const [isLoadingTambak, setIsLoadingTambak] = useState(true);
  const [isLoadingSiklus, setIsLoadingSiklus] = useState(false);
  const [isLoadingHPP, setIsLoadingHPP] = useState(false);
  const [error, setError] = useState("");

  // ── Fetch Tambak ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchTambak = async () => {
      setIsLoadingTambak(true);
      try {
        const res = await fetch("/api/tambak");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setTambaks(json.data || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoadingTambak(false);
      }
    };
    fetchTambak();
  }, []);

  // ── Fetch Siklus by Tambak ────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedTambakId) {
      setSiklus([]);
      setSelectedSiklusId("");
      setHppData(null);
      return;
    }
    const fetchSiklus = async () => {
      setIsLoadingSiklus(true);
      setHppData(null);
      setSelectedSiklusId("");
      try {
        const res = await fetch(`/api/siklus?tambakId=${selectedTambakId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setSiklus(json.data || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoadingSiklus(false);
      }
    };
    fetchSiklus();
  }, [selectedTambakId]);

  // ── Fetch HPP Data ────────────────────────────────────────────────────────
  const fetchHPP = useCallback(async () => {
    if (!selectedSiklusId) return;
    setIsLoadingHPP(true);
    setError("");
    try {
      const res = await fetch(`/api/hpp?siklusId=${selectedSiklusId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setHppData(json.data);
      // Default active tab = rekap
      setActiveTab("rekap");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoadingHPP(false);
    }
  }, [selectedSiklusId]);

  useEffect(() => {
    fetchHPP();
  }, [fetchHPP]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const filteredSiklus = siklus.filter((s) => s.tambak_id === selectedTambakId);
  const selectedSiklusObj = filteredSiklus.find((s) => s.siklus_id === selectedSiklusId);
  const tabs = hppData
    ? [
        { key: "rekap", label: "Rekap Tambak" },
        ...hppData.hppPerKomoditas.map((k) => ({
          key: k.komoditas_id,
          label: k.nama_komoditas,
        })),
      ]
    : [];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24 md:pb-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 text-slate-900 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">HPP &amp; Harga Jual</h3>
            <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
              Hitung biaya produksi, HPP, dan analisis laba per komoditas
            </p>
          </div>
        </div>
      </div>

      {/* Selector: Tambak & Siklus */}
      <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900">
            Pilih Tambak &amp; Siklus
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Tambak */}
          <div className="space-y-1.5">
            <label htmlFor="tambak" className="text-xs font-semibold text-slate-700">Kolam / Tambak</label>
            <select
              id="tambak"
              value={selectedTambakId}
              onChange={(e) => setSelectedTambakId(e.target.value)}
              disabled={isLoadingTambak}
              className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="" disabled>
                {isLoadingTambak ? "Memuat..." : "Pilih tambak..."}
              </option>
              {tambaks.map((t) => (
                <option key={t.tambak_id} value={t.tambak_id}>
                  {t.nama_tambak}
                  {t.lokasi ? ` — ${t.lokasi}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Siklus */}
          <div className="space-y-1.5">
            <label htmlFor="siklus" className="text-xs font-semibold text-slate-700">Siklus Budidaya</label>
            <select
              id="siklus"
              value={selectedSiklusId}
              onChange={(e) => setSelectedSiklusId(e.target.value)}
              disabled={!selectedTambakId || isLoadingSiklus || filteredSiklus.length === 0}
              className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="" disabled>
                {isLoadingSiklus
                  ? "Memuat..."
                  : !selectedTambakId
                  ? "Pilih tambak dulu"
                  : filteredSiklus.length === 0
                  ? "Belum ada siklus"
                  : "Pilih siklus..."}
              </option>
              {filteredSiklus.map((s) => (
                <option key={s.siklus_id} value={s.siklus_id}>
                  Siklus #{s.nomor_siklus} — {s.status === "aktif" ? "Aktif" : "Selesai"}
                </option>
              ))}
            </select>
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoadingHPP && (
        <div className="flex items-center justify-center gap-3 py-12 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Menghitung HPP...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoadingHPP && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Empty — no siklus selected */}
      {!selectedSiklusId && !isLoadingHPP && !error && (
        <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
          <Calculator className="h-12 w-12 text-slate-200" />
          <p className="text-sm font-medium text-center">
            Pilih tambak dan siklus budidaya untuk melihat laporan HPP
          </p>
        </div>
      )}

      {/* HPP Content */}
      {hppData && !isLoadingHPP && (
        <>
          {/* Tabs */}
          {tabs.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-colors border ${
                    activeTab === tab.key
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <button
                onClick={fetchHPP}
                className="shrink-0 rounded-xl px-3 py-2 border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors ml-auto"
                title="Refresh data"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* No Komoditas */}
          {hppData.hppPerKomoditas.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-8">
              <AlertCircle className="h-8 w-8 text-amber-400" />
              <p className="text-sm font-medium text-amber-700 text-center">
                Siklus ini belum memiliki komoditas. Tambahkan komoditas terlebih dahulu di halaman Siklus Budidaya.
              </p>
            </div>
          )}

          {/* Tab: Rekap Tambak */}
          {activeTab === "rekap" && hppData.hppPerKomoditas.length > 0 && (
            <HPPTambakSummary
              hppPerKomoditas={hppData.hppPerKomoditas}
              rekapTambak={hppData.rekapTambak}
              namaTambak={hppData.tambak?.nama_tambak || "Tambak"}
              nomorSiklus={hppData.siklus?.nomor_siklus || "—"}
            />
          )}

          {/* Tab: Per Komoditas */}
          {hppData.hppPerKomoditas.map((k) =>
            activeTab === k.komoditas_id ? (
              <HPPKomoditasCard
                key={k.komoditas_id}
                data={k}
                siklusId={selectedSiklusId}
                onSettingsSaved={fetchHPP}
              />
            ) : null
          )}
        </>
      )}
    </div>
  );
}
