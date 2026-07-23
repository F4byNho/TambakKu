"use client";

import React, { useState, useCallback } from "react";
import { toast } from "sonner";
import { Save, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HPPKomoditasData {
  komoditas_id: string;
  nama_komoditas: string;
  jenis_komoditas: string;
  status: string;
  // Settings
  alokasiPersen: number;
  markupPersen: number;
  marginPersen: number;
  hargaJualInput: number;
  // Bagian 1
  biayaBenur: number;
  biayaLangsung: number;
  biayaTKLangsung: number;
  biayaUmumBersama: number;
  tkUmumBersama: number;
  totalBiayaBersama: number;
  biayaBersamaTeralokasi: number;
  totalBiayaProduksi: number;
  // Bagian 2
  totalPanen: number;
  hppPerKg: number;
  // Bagian 3
  hargaJualMarkup: number;
  hargaJualMargin: number;
  // Bagian 4
  marginPerKg: number;
  marginPersen_aktual: number;
  totalPendapatan: number;
  labaBersih: number;
}

interface Props {
  data: HPPKomoditasData;
  siklusId: string;
  onSettingsSaved: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRp(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatNum(n: number, dec = 0): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

// ─── Row Component ───────────────────────────────────────────────────────────

function Row({
  label,
  value,
  bold,
  highlight,
  sub,
  indent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
  sub?: boolean;
  indent?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 px-4 py-2.5 text-sm border-b border-slate-100 last:border-0 ${
        highlight
          ? "bg-blue-50/80 border border-blue-100 rounded-xl my-1 shadow-2xs"
          : sub
          ? "bg-slate-50/40"
          : ""
      }`}
    >
      <span
        className={`${bold ? "font-bold text-slate-900" : "font-medium text-slate-600"} ${
          indent ? "pl-4 text-slate-500" : ""
        } text-xs sm:text-sm`}
      >
        {label}
      </span>
      <span
        className={`font-mono shrink-0 ${
          highlight ? "font-black text-blue-700 text-base" : bold ? "font-bold text-slate-900" : "font-semibold text-slate-700"
        } text-xs sm:text-sm`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 border border-slate-200/80 text-slate-800 rounded-xl mt-5 first:mt-0 shadow-2xs">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-[11px] font-extrabold">
        {num}
      </span>
      <span className="text-xs sm:text-sm font-extrabold tracking-wider uppercase text-slate-900">
        {title}
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function HPPKomoditasCard({ data, siklusId, onSettingsSaved }: Props) {
  const [alokasi, setAlokasi] = useState(String(data.alokasiPersen));
  const [markup, setMarkup] = useState(String(data.markupPersen));
  const [margin, setMargin] = useState(String(data.marginPersen));
  const [hargaJual, setHargaJual] = useState(
    data.hargaJualInput > 0 ? String(data.hargaJualInput) : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // Live calculations based on local state
  const hppPerKg = data.hppPerKg;
  const markupVal = parseFloat(markup) || 0;
  const marginVal = parseFloat(margin) || 0;
  const alokasiVal = parseFloat(alokasi) || 0;

  const biayaBersamaTeralokasi = data.totalBiayaBersama * (alokasiVal / 100);
  const totalBiayaProduksi =
    data.biayaBenur + data.biayaLangsung + data.biayaTKLangsung + biayaBersamaTeralokasi;
  const hppLive = data.totalPanen > 0 ? totalBiayaProduksi / data.totalPanen : 0;

  const hargaJualMarkupLive = hppLive * (1 + markupVal / 100);
  const hargaJualMarginLive =
    marginVal < 100 ? hppLive / (1 - marginVal / 100) : 0;

  const hargaJualAktual = parseFloat(hargaJual) || 0;
  const marginPerKgLive = hargaJualAktual > 0 ? hargaJualAktual - hppLive : 0;
  const marginPersenLive =
    hargaJualAktual > 0 ? (marginPerKgLive / hargaJualAktual) * 100 : 0;
  const totalPendapatanLive =
    hargaJualAktual > 0 ? data.totalPanen * hargaJualAktual : data.totalPendapatan;
  const labaBersihLive = totalPendapatanLive - totalBiayaProduksi;

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/hpp/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siklusId,
          komoditasId: data.komoditas_id,
          alokasiPersen: parseFloat(alokasi) || 0,
          markupPersen: parseFloat(markup) || 30,
          marginPersen: parseFloat(margin) || 30,
          hargaJualInput: parseFloat(hargaJual) || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");
      toast.success("Pengaturan HPP berhasil disimpan");
      onSettingsSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  }, [alokasi, markup, margin, hargaJual, siklusId, data.komoditas_id, onSettingsSaved]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition-all animate-in fade-in duration-200">
      {/* Card Header */}
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 border-b border-blue-100 bg-gradient-to-r from-blue-50/90 via-white to-blue-50/40 px-5 py-4 text-left transition-colors hover:bg-blue-50/60"
        onClick={() => setIsOpen((v) => !v)}
      >
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">
            HPP &amp; Harga Jual
          </span>
          <h3 className="text-lg font-black text-slate-900 capitalize mt-0.5">
            {data.nama_komoditas}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center rounded-full bg-blue-100/80 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 uppercase tracking-wider border border-blue-200/80">
            {data.jenis_komoditas || "Komoditas"}
          </span>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-slate-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-500" />
          )}
        </div>
      </button>

      {isOpen && (
          <div className="p-4 space-y-1">
            {/* ── BAGIAN 1: BIAYA PRODUKSI ──────────────── */}
            <SectionHeader num="1" title="Biaya Produksi" />

            <Row
              label={`Biaya Langsung ${data.nama_komoditas}`}
              value={formatRp(data.biayaLangsung + data.biayaBenur)}
            />
            <Row
              label="  • Biaya Pembelian Bibit/Benur"
              value={formatRp(data.biayaBenur)}
              indent
              sub
            />
            <Row
              label="  • Biaya Operasional Langsung"
              value={formatRp(data.biayaLangsung)}
              indent
              sub
            />
            <Row
              label={`Biaya Tenaga Kerja ${data.nama_komoditas}`}
              value={formatRp(data.biayaTKLangsung)}
            />
            <Row
              label="Total Biaya Umum/Bersama"
              value={formatRp(data.totalBiayaBersama)}
            />
            <Row
              label="  • Biaya Operasional Bersama"
              value={formatRp(data.biayaUmumBersama)}
              indent
              sub
            />
            <Row
              label="  • Tenaga Kerja Bersama"
              value={formatRp(data.tkUmumBersama)}
              indent
              sub
            />

            {/* Alokasi Input */}
            <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl mt-2">
              <div className="flex items-center gap-2 mb-1.5">
                <Info className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <Label className="text-xs font-bold text-amber-800">
                  % Alokasi Biaya Bersama ke {data.nama_komoditas}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={alokasi}
                  onChange={(e) => setAlokasi(e.target.value)}
                  className="h-9 text-right font-mono text-sm max-w-[120px] border-amber-300 focus:border-amber-500"
                />
                <span className="text-sm font-bold text-amber-700">%</span>
                <span className="text-xs text-amber-600 ml-1">
                  = {formatRp(biayaBersamaTeralokasi)} dialokasikan
                </span>
              </div>
            </div>

            <Row
              label={`Total Biaya Produksi ${data.nama_komoditas}`}
              value={formatRp(totalBiayaProduksi)}
              bold
              highlight
            />

            {/* ── BAGIAN 2: HASIL PANEN & HPP ────────────── */}
            <SectionHeader num="2" title="Hasil Panen & HPP per kg" />

            <Row
              label="Total Panen (kg)"
              value={`${formatNum(data.totalPanen, 1)} kg`}
            />
            <Row
              label="HPP per kg"
              value={formatRp(hppLive)}
              bold
              highlight
            />

            {/* ── BAGIAN 3: KALKULATOR HARGA JUAL ─────────── */}
            <SectionHeader num="3" title="Kalkulator Harga Jual (Opsional)" />

            {/* Markup */}
            <div className="px-4 py-2.5 flex items-center justify-between gap-4 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  A. Markup Pricing — % Markup dari HPP
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Harga Jual = HPP × (1 + Markup%)
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Input
                  type="number"
                  min={0}
                  value={markup}
                  onChange={(e) => setMarkup(e.target.value)}
                  className="h-8 w-20 text-right font-mono text-sm border-slate-200"
                />
                <span className="text-sm font-semibold text-slate-600">%</span>
              </div>
            </div>
            <Row
              label="Harga Jual (Markup)"
              value={formatRp(hargaJualMarkupLive)}
              sub
            />

            {/* Margin */}
            <div className="px-4 py-2.5 flex items-center justify-between gap-4 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  B. Margin Pricing — % Margin dari Harga Jual
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Harga Jual = HPP ÷ (1 − Margin%)
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Input
                  type="number"
                  min={0}
                  max={99}
                  value={margin}
                  onChange={(e) => setMargin(e.target.value)}
                  className="h-8 w-20 text-right font-mono text-sm border-slate-200"
                />
                <span className="text-sm font-semibold text-slate-600">%</span>
              </div>
            </div>
            <Row
              label="Harga Jual (Margin) — Direkomendasikan"
              value={formatRp(hargaJualMarginLive)}
              sub
            />

            {/* ── BAGIAN 4: MARGIN & LABA ─────────────────── */}
            <SectionHeader num="4" title="Margin & Laba dari Harga Jual Aktual (Pengepul)" />

            {/* Harga Jual Aktual Input */}
            <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl mt-2">
              <Label className="text-xs font-bold text-green-800 block mb-1.5">
                Harga Jual Aktual per kg (dari Pengepul)
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-green-700">Rp</span>
                <Input
                  type="number"
                  min={0}
                  value={hargaJual}
                  onChange={(e) => setHargaJual(e.target.value)}
                  placeholder="0"
                  className="h-9 text-right font-mono text-sm border-green-300 focus:border-green-500"
                />
                <span className="text-xs text-green-600 shrink-0">/ kg</span>
              </div>
            </div>

            <Row
              label="Margin per kg"
              value={hargaJualAktual > 0 ? formatRp(marginPerKgLive) : "—"}
            />
            <Row
              label="Margin (%)"
              value={
                hargaJualAktual > 0
                  ? `${formatNum(marginPersenLive, 1)}%`
                  : "—"
              }
            />
            <Row
              label="Total Pendapatan"
              value={formatRp(totalPendapatanLive)}
              bold
            />
            <Row
              label="Laba Bersih"
              value={formatRp(labaBersihLive)}
              bold
              highlight
            />

            {/* Save Button */}
            <div className="pt-3">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm gap-2 rounded-xl shadow-2xs transition-all"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Menyimpan..." : "Simpan Pengaturan HPP"}
              </Button>
            </div>
          </div>
      )}
    </div>
  );
}
