"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Database, 
  Activity, 
  Calculator, 
  FileText, 
  LogOut, 
  X,
  User,
  Users,
  Layers,
  RotateCcw,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePokdakan } from "@/context/pokdakan-context";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    nama: string;
    email: string;
    role: string;
  } | null;
}

export default function Sidebar({ isOpen, onClose, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeAnggota, activeTambak, clearActiveContext } = usePokdakan();

  // 1. Menu Mode Pokdakan (Belum Pilih Tambak): Hanya Dashboard & Data Anggota
  const pokdakanMenuItems = [
    { 
      name: "Dashboard", 
      desc: "Ringkasan & Pilih Tambak", 
      href: "/dashboard", 
      icon: LayoutDashboard 
    },
    { 
      name: "Data Anggota", 
      desc: "Petambak Pokdakan", 
      href: "/anggota", 
      icon: Users 
    },
  ];

  // 2. Menu Mode Personal Tambak (Setelah Memilih Tambak): Dashboard, Data Tambak, Siklus, Pembukuan, Laporan
  const personalMenuItems = [
    { 
      name: "Dashboard", 
      desc: "Ringkasan Budidaya", 
      href: "/dashboard", 
      icon: LayoutDashboard 
    },
    { 
      name: "Data Tambak", 
      desc: "Daftar & Luas Kolam", 
      href: "/tambak", 
      icon: Database 
    },
    { 
      name: "Siklus Budidaya", 
      desc: "Pantau Budidaya & Panen", 
      href: "/siklus", 
      icon: Activity 
    },
    { 
      name: "Pembukuan & HPP", 
      desc: "Keuangan & Analisis Harga", 
      href: "/pembukuan", 
      icon: Calculator 
    },
    { 
      name: "Laporan", 
      desc: "Cetak & Unduh Laporan", 
      href: "/laporan", 
      icon: FileText 
    },
  ];

  // Tentukan menu berdasarkan apakah anggota/tambak aktif sudah terpilih
  const menuItems = (activeAnggota || activeTambak) ? personalMenuItems : pokdakanMenuItems;

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Gagal logout");
      
      toast.success("Berhasil keluar dari akun");
      router.push("/login");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Gagal logout");
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 transition-transform duration-200 lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header Logo */}
        <div className="flex items-center justify-between px-2 mb-4">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-extrabold text-lg text-white shadow-xs">
              T
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 block leading-none">
                TambakKu
              </span>
              <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase mt-1 block">
                Pencatatan Budidaya
              </span>
            </div>
          </Link>
          <button 
            onClick={onClose} 
            className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 active:bg-slate-200 lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Tutup Menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Active Context Card inside Sidebar if Anggota or Tambak Selected */}
        {(activeAnggota || activeTambak) && (
          <div className="mx-1 mb-4 p-3 rounded-2xl bg-blue-50/80 border border-blue-200/80 space-y-1 rounded-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" /> {activeTambak ? "Tambak Aktif" : "Anggota Aktif"}
              </span>
              <button
                onClick={() => {
                  clearActiveContext();
                  router.push("/dashboard");
                  onClose();
                }}
                className="text-[10px] text-slate-500 hover:text-red-600 font-bold flex items-center gap-0.5"
                title="Keluar ke Mode Pokdakan Overview"
              >
                <RotateCcw className="h-2.5 w-2.5" /> Ganti
              </button>
            </div>
            <p className="text-xs font-black text-slate-900 truncate capitalize flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-blue-600 shrink-0" /> {activeTambak ? activeTambak.nama_tambak : (activeAnggota?.nama_anggota || "Anggota")}
            </p>
            {activeTambak && (
              <p className="text-[10px] text-slate-600 truncate capitalize font-semibold">
                {activeAnggota?.nama_anggota || "Anggota"}
              </p>
            )}
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1.5 px-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3.5 rounded-xl px-3.5 py-3 transition-colors text-xs font-semibold min-h-[48px]",
                  isActive
                    ? "bg-blue-50 text-blue-700 font-bold border border-blue-100"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-blue-600" : "text-slate-400")} />
                <div className="flex flex-col">
                  <span className="leading-snug text-xs sm:text-sm font-bold">{item.name}</span>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 font-normal leading-none mt-0.5">
                    {item.desc}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-slate-100 pt-4 px-1 space-y-2">
          {user && (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-xs shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate">{user.nama}</p>
                <p className="text-[10px] text-slate-500 truncate capitalize">{user.role || "Petambak"}</p>
              </div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
            Keluar Akun
          </button>
        </div>
      </aside>
    </>
  );
}
