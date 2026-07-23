"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

interface NavbarProps {
  onOpenSidebar: () => void;
  user: {
    nama: string;
    email: string;
    role: string;
  } | null;
}

export default function Navbar({ onOpenSidebar, user }: NavbarProps) {
  const pathname = usePathname();

  // Mendapatkan judul & deskripsi halaman berdasarkan rute URL
  const getPageHeader = () => {
    if (pathname.startsWith("/dashboard")) return {
      title: "Dashboard Ringkasan",
      subtitle: "Ringkasan kondisi tambak, modal, dan hasil panen Anda"
    };
    if (pathname.startsWith("/tambak")) return {
      title: "Data Kolam Tambak",
      subtitle: "Daftar lokasi dan luas kolam tambak Anda"
    };
    if (pathname.startsWith("/siklus")) return {
      title: "Siklus Budidaya Tambak",
      subtitle: "Pencatatan bibit/benur, biaya harian, sampling berat, dan panen"
    };
    if (pathname.startsWith("/pembukuan")) return {
      title: "Pembukuan & HPP",
      subtitle: "Rekapitulasi arus kas, modal panen, serta analisis HPP per kg"
    };
    if (pathname.startsWith("/laporan")) return {
      title: "Ekspor & Cetak Laporan",
      subtitle: "Unduh laporan PDF pencatatan tambak untuk pembukuan"
    };
    return {
      title: "TambakKu",
      subtitle: "Aplikasi Pencatatan Budidaya Tambak & Polikultur"
    };
  };

  const headerInfo = getPageHeader();

  // Format tanggal hari ini
  const getFormattedDate = () => {
    return new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <header className="flex h-16 sm:h-18 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3 sm:gap-4 py-2">
        {/* Mobile Toggle Button (Touch Friendly) */}
        <button
          onClick={onOpenSidebar}
          className="rounded-xl p-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 lg:hidden shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Buka Menu Navigasi"
          aria-label="Buka Menu"
        >
          <Menu className="h-5.5 w-5.5" />
        </button>
        
        {/* Page Title & Subtitle */}
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {headerInfo.title}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 leading-tight mt-0.5 font-normal">
            {headerInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-3">
        <span className="inline-flex items-center rounded-lg bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200">
          {getFormattedDate()}
        </span>
      </div>
    </header>
  );
}
