"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";

export default function DashboardLayoutWrapper({
  children,
  user,
}: {
  children: React.ReactNode;
  user: {
    nama: string;
    email: string;
    role: string;
  } | null;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Sidebar Navigasi */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        user={user} 
      />

      {/* Area Konten Utama */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <Navbar 
          onOpenSidebar={() => setSidebarOpen(true)} 
          user={user} 
        />

        {/* Isi Konten Halaman */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/30">
          {children}
        </main>
      </div>
    </div>
  );
}
