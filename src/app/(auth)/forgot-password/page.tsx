"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PhoneIcon, MailIcon, ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 font-bold text-xl text-white shadow-lg shadow-blue-200">
            T
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950">
            TambakKu
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Lupa Password Akun Anda
          </p>
        </div>

        <Card className="border-slate-100 shadow-xl shadow-slate-100">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Hubungi Administrator</CardTitle>
            <CardDescription>
              Demi alasan keamanan, pemulihan dan pengaturan ulang kata sandi dikelola secara terpusat oleh administrator.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              Silakan hubungi administrator program KKN atau kontak dukungan teknis TambakKu di bawah ini untuk mengajukan reset password.
            </p>
            
            <div className="space-y-3 rounded-xl bg-slate-50 border border-slate-100 p-4">
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <PhoneIcon className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                <div>
                  <p className="font-semibold">WhatsApp Support</p>
                  <p className="text-xs text-slate-500">+62 812-3456-7890</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <MailIcon className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                <div>
                  <p className="font-semibold">Email Administrator</p>
                  <p className="text-xs text-slate-500">admin@tambakku.kkn.id</p>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 text-center leading-relaxed">
              *Harap siapkan Nama Lengkap, Alamat, dan Email terdaftar Anda saat menghubungi administrator.
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full font-semibold flex items-center justify-center gap-2">
                <ArrowLeftIcon className="h-4 w-4" />
                Kembali ke Halaman Masuk
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
