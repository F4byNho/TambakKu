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
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl bg-slate-900 px-5 py-4 text-white">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Rekap Tambak — Siklus #{nomorSiklus}
        </p>
        <h3 className="text-lg font-extrabold text-white mt-0.5">{namaTambak}</h3>
        <p className="text-xs text-slate-400 mt-1">
          Akumulasi {hppPerKomoditas.length} komoditas
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {metricCards.map((m) => {
          const Icon = m.icon;
          const colorMap: Record<string, string> = {
            blue: "bg-blue-50 text-blue-700 border-blue-100",
            green: "bg-green-50 text-green-700 border-green-100",
            emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
            red: "bg-red-50 text-red-700 border-red-100",
            purple: "bg-purple-50 text-purple-700 border-purple-100",
          };
          const iconColor = colorMap[m.color] || "bg-slate-50 text-slate-700 border-slate-100";

          return (
            <div
              key={m.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${iconColor} mb-2.5`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                {m.label}
              </p>
              <p className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5 leading-tight">
                {m.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Margin keseluruhan */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
          Margin Keseluruhan Tambak
        </p>
        <p
          className={`text-2xl font-extrabold ${
            marginTambak >= 0 ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {formatNum(marginTambak, 1)}%
        </p>
      </div>

      {/* Kontribusi per Komoditas */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 text-white">
          <Package className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wide">
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
              <div key={k.komoditas_id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{k.nama_komoditas}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{k.jenis_komoditas}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-extrabold ${
                        isPositive ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {formatRp(k.labaBersih)}
                    </p>
                    <div className={`flex items-center justify-end gap-0.5 mt-0.5 ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                      <LabelIcon className="h-3 w-3" />
                      <p className="text-[11px] font-semibold">
                        {formatNum(Math.abs(kontribusi), 1)}% kontribusi laba
                      </p>
                    </div>
                  </div>
                </div>
                {/* Progress bar kontribusi */}
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isPositive ? "bg-emerald-400" : "bg-red-400"}`}
                    style={{ width: `${Math.min(Math.abs(kontribusi), 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                  <span>Modal: {formatRp(k.totalBiayaProduksi)}</span>
                  <span>Panen: {formatNum(k.totalPanen, 1)} kg</span>
                  <span>HPP: {formatRp(k.hppPerKg)}/kg</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
