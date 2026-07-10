import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import DashboardLayoutWrapper from "./layout-client";

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

  return (
    <DashboardLayoutWrapper user={user}>
      {children}
    </DashboardLayoutWrapper>
  );
}
