import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import DashboardLayoutWrapper from "./layout-client";
import { fetchFromGAS } from "@/lib/gas-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  // Proteksi server-side jika session kosong
  if (!user) {
    redirect("/login");
  }

  // Verifikasi ke database Google Sheets apakah akun user masih terdaftar
  const { data: dbUser } = await fetchFromGAS<any>("getUserByEmail", { email: user.email });
  if (!dbUser) {
    // Jika tidak ditemukan di database (misal dihapus), bersihkan cookie dan tendang ke login
    redirect("/api/auth/logout-deleted");
  }

  return (
    <DashboardLayoutWrapper user={user}>
      {children}
    </DashboardLayoutWrapper>
  );
}
