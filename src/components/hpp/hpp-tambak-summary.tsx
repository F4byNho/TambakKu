"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus, Package, Wallet, Coins, Scale } from "lucide-react";
import { HPPKomoditasData } from "./hpp-komoditas-card";

interface Props {
  hppPerKomoditas: HPPKomoditasData[];
  rekapTambak: {
    totalModalTambak: number;
    totalPendapatanTambak: number;
    totalLabaTambak: number;
    totalProduksiTambak: number;
  };
  namaTambak: string;
  nomorSiklus: number | string;
}

function formatRp(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatNum(n: number, dec = 1): string {
  if (!isFinite(n) || isNaN(n)) return "0";
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

export default function HPPTambakSummary({
  hppPerKomoditas,
  rekapTambak,
  namaTambak,
  nomorSiklus,
}: Props) {
  const { totalModalTambak, totalPendapatanTambak, totalLabaTambak, totalProduksiTambak } =
    rekapTambak;
  const marginTambak =
    totalPendapatanTambak > 0
      ? (totalLabaTambak / totalPendapatanTambak) * 100
      : 0;

  const metricCards = [
    {
      label: "Total Modal",
      value: formatRp(totalModalTambak),
      icon: Wallet,
      color: "blue",
    },
    {
      label: "Total Pendapatan",
      value: formatRp(totalPendapatanTambak),
      icon: Coins,
      color: "green",
    },
    {
      label: "Total Laba",
      value: formatRp(totalLabaTambak),
      icon: totalLabaTambak >= 0 ? TrendingUp : TrendingDown,
      color: totalLabaTambak >= 0 ? "emerald" : "red",
    },
    {
      label: "Total Produksi",
      value: `${formatNum(totalProduksiTambak)} kg`,
      icon: Scale,
      color: "purple",
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="rounded-2xl border border-blue-100/90 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/30 p-5 shadow-2xs">
        <div className="flex items-center justify-between gap-3 mb-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-blue-700 border border-blue-200/60">
            Rekap Tambak — Siklus #{nomorSiklus}
          </span>
          <span className="text-xs font-bold text-slate-400">
            Akumulasi {hppPerKomoditas.length} Komoditas
          </span>
        </div>
        <h3 className="text-xl font-black text-slate-900 mt-1">{namaTambak}</h3>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {metricCards.map((m) => {
          const Icon = m.icon;
          const colorMap: Record<string, string> = {
            blue: "bg-blue-50 text-blue-600 border-blue-100",
            green: "bg-emerald-50 text-emerald-600 border-emerald-100",
            emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
            red: "bg-red-50 text-red-600 border-red-100",
            purple: "bg-purple-50 text-purple-600 border-purple-100",
          };
          const iconColor = colorMap[m.color] || "bg-slate-50 text-slate-700 border-slate-100";

          return (
            <div
              key={m.label}
              className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs transition-all hover:shadow-xs hover:border-blue-200"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${iconColor} mb-2.5 shadow-2xs`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {m.label}
              </p>
              <p className="text-base sm:text-lg font-black text-slate-900 mt-0.5 leading-tight">
                {m.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Margin keseluruhan */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Margin Keseluruhan Tambak
          </p>
          <p
            className={`text-2xl font-black mt-0.5 ${
              marginTambak >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {formatNum(marginTambak, 1)}%
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-extrabold ${marginTambak >= 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {marginTambak >= 0 ? "Margin Positif" : "Margin Defisit"}
        </div>
      </div>

      {/* Kontribusi per Komoditas */}
      <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100 text-slate-800">
          <Package className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
            Kontribusi per Komoditas
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {hppPerKomoditas.map((k) => {
            const kontribusi =
              totalLabaTambak !== 0 ? (k.labaBersih / Math.abs(totalLabaTambak)) * 100 : 0;
            const isPositive = k.labaBersih >= 0;
            const LabelIcon = isPositive ? TrendingUp : k.labaBersih === 0 ? Minus : TrendingDown;

            return (
              <div key={k.komoditas_id} className="px-4 py-3.5 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900 capitalize">{k.nama_komoditas}</p>
                    <p className="text-[11px] text-slate-400 font-medium capitalize mt-0.5">{k.jenis_komoditas}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-black ${
                        isPositive ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {formatRp(k.labaBersih)}
                    </p>
                    <div className={`flex items-center justify-end gap-0.5 mt-0.5 ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                      <LabelIcon className="h-3 w-3" />
                      <p className="text-[11px] font-bold">
                        {formatNum(Math.abs(kontribusi), 1)}% kontribusi laba
                      </p>
                    </div>
                  </div>
                </div>
                {/* Progress bar kontribusi */}
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isPositive ? "bg-emerald-500" : "bg-red-400"}`}
                    style={{ width: `${Math.min(Math.abs(kontribusi), 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px] font-medium text-slate-500">
                  <span>Modal: <strong className="text-slate-800">{formatRp(k.totalBiayaProduksi)}</strong></span>
                  <span>Panen: <strong className="text-slate-800">{formatNum(k.totalPanen, 1)} kg</strong></span>
                  <span>HPP: <strong className="text-blue-600">{formatRp(k.hppPerKg)}/kg</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
