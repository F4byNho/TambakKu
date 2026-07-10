import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TambakKu - Digitalisasi Budidaya Udang & Pembukuan Tambak",
  description: "Aplikasi pencatatan budidaya udang vaname dan pembukuan usaha tambak untuk petambak skala kecil dan menengah.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}

