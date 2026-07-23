"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { usePokdakan } from "@/context/pokdakan-context";

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
  const { activeAnggota, activeTambak } = usePokdakan();

  // Mendapatkan judul & deskripsi halaman berdasarkan rute URL
  const getPageHeader = () => {
    if (pathname.startsWith("/dashboard")) return {
      title: activeTambak ? `Dashboard ${activeTambak.nama_tambak}` : "Dashboard Pokdakan",
      subtitle: activeTambak 
        ? (activeAnggota?.nama_anggota || "Anggota") 
        : `Kelompok Pembudidaya Ikan ${user?.nama || "Onggojoyo Jaya"}`
    };
    if (pathname.startsWith("/anggota")) return {
      title: "Data Anggota Pokdakan",
      subtitle: `Daftar anggota pembudidaya ${user?.nama ? `[${user.nama}]` : ""}`
    };
    if (pathname.startsWith("/tambak")) return {
      title: "Data Aset Tambak",
      subtitle: activeTambak ? (activeAnggota?.nama_anggota || "Anggota") : "Daftar seluruh tambak milik anggota Pokdakan"
    };
    if (pathname.startsWith("/siklus")) return {
      title: "Siklus Budidaya",
      subtitle: activeTambak ? `Tambak: ${activeTambak.nama_tambak} (${activeAnggota?.nama_anggota})` : "Pilih tambak untuk mengelola siklus budidaya"
    };
    if (pathname.startsWith("/pembukuan")) return {
      title: "Pembukuan & HPP",
      subtitle: activeTambak ? `Tambak: ${activeTambak.nama_tambak} (${activeAnggota?.nama_anggota})` : "Rekapitulasi keuangan & analisis HPP Pokdakan"
    };
    if (pathname.startsWith("/laporan")) return {
      title: "Ekspor & Cetak Laporan",
      subtitle: activeTambak ? `Laporan khusus ${activeTambak.nama_tambak}` : "Cetak laporan seluruh kegiatan Pokdakan"
    };
    return {
      title: "TambakKu Pokdakan",
      subtitle: `Sistem Manajemen Pokdakan ${user?.nama || ""}`
    };
  };

  const headerInfo = getPageHeader();

  return (
    <header className="flex h-16 sm:h-18 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 shrink-0 sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-3 sm:gap-4 py-2">
        {/* Mobile Toggle Button */}
        <button
          onClick={onOpenSidebar}
          className="rounded-xl p-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 lg:hidden shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Buka Menu Navigasi"
          aria-label="Buka Menu"
        >
          <Menu className="h-5.5 w-5.5" />
        </button>
        
        {/* Page Title & Context Header */}
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight flex items-center gap-2 capitalize">
            {headerInfo.title}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 leading-tight mt-0.5 font-normal capitalize">
            {headerInfo.subtitle}
          </p>
        </div>
      </div>
    </header>
  );
}
