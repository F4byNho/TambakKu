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

  // Mendapatkan judul halaman berdasarkan rute URL
  const getPageTitle = () => {
    if (pathname.startsWith("/dashboard")) return "Dashboard Ringkasan";
    if (pathname.startsWith("/tambak")) return "Manajemen Tambak";
    if (pathname.startsWith("/siklus")) return "Siklus Budidaya";
    if (pathname.startsWith("/pembukuan")) return "Pembukuan Keuangan";
    if (pathname.startsWith("/laporan")) return "Ekspor Laporan";
    return "TambakKu";
  };

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
    <header className="flex h-16 items-center justify-between border-b border-slate-100 bg-white px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-4">
        {/* Mobile Toggle Button */}
        <button
          onClick={onOpenSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        {/* Page Title */}
        <div>
          <h1 className="text-lg font-bold text-slate-900 md:text-xl">
            {getPageTitle()}
          </h1>
          <p className="hidden text-xs text-slate-500 md:block mt-0.5">
            {getFormattedDate()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
      </div>
    </header>
  );
}
