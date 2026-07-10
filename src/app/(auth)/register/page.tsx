"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/validators/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nama: "",
      email: "",
      password: "",
      nomor_hp: "",
      alamat: "",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Gagal mendaftar");
      }

      toast.success("Registrasi berhasil! Selamat bergabung di TambakKu.");
      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat mendaftar");
    } finally {
      setIsLoading(false);
    }
  };

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
            Mulai Digitalisasi Pencatatan Tambak Anda
          </p>
        </div>

        <Card className="border-slate-100 shadow-xl shadow-slate-100">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Daftar Akun Baru</CardTitle>
            <CardDescription>
              Lengkapi data di bawah ini untuk membuat akun petambak.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap</Label>
                <Input
                  id="nama"
                  placeholder="Budi Santoso"
                  disabled={isLoading}
                  {...register("nama")}
                  className={errors.nama ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.nama && (
                  <p className="text-xs text-red-500">{errors.nama.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="budi@email.com"
                  disabled={isLoading}
                  {...register("email")}
                  className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    disabled={isLoading}
                    {...register("password")}
                    className={errors.password ? "border-red-500 pr-10 focus-visible:ring-red-500" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4.5 w-4.5" />
                    ) : (
                      <EyeIcon className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nomor_hp">Nomor HP</Label>
                <Input
                  id="nomor_hp"
                  placeholder="0812XXXXXXXX"
                  disabled={isLoading}
                  {...register("nomor_hp")}
                  className={errors.nomor_hp ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.nomor_hp && (
                  <p className="text-xs text-red-500">{errors.nomor_hp.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="alamat">Alamat Tambak / Rumah</Label>
                <Input
                  id="alamat"
                  placeholder="Jl. Raya Pantai Utara No. 12, Indramayu"
                  disabled={isLoading}
                  {...register("alamat")}
                  className={errors.alamat ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.alamat && (
                  <p className="text-xs text-red-500">{errors.alamat.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-semibold" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Membuat Akun...
                  </>
                ) : (
                  "Daftar"
                )}
              </Button>
              <div className="text-center text-sm text-slate-500">
                Sudah memiliki akun?{" "}
                <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                  Masuk Sekarang
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
