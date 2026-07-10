"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { tambakSchema, type TambakInput } from "@/validators/tambak";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TambakFormProps {
  initialValues?: {
    nama_tambak: string;
    lokasi: string;
    luas_tambak: number;
    keterangan?: string;
  };
  onSubmit: (data: TambakInput) => void;
  isLoading: boolean;
  onCancel: () => void;
  submitLabel: string;
}

export default function TambakForm({
  initialValues,
  onSubmit,
  isLoading,
  onCancel,
  submitLabel,
}: TambakFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TambakInput>({
    resolver: zodResolver(tambakSchema) as any,
    defaultValues: initialValues || {
      nama_tambak: "",
      lokasi: "",
      luas_tambak: "" as any,
      keterangan: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label htmlFor="nama_tambak">Nama Tambak / Kolam</Label>
        <Input
          id="nama_tambak"
          placeholder="Kolam A / Tambak Utara"
          disabled={isLoading}
          {...register("nama_tambak")}
          className={errors.nama_tambak ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
        {errors.nama_tambak && (
          <p className="text-xs text-red-500">{errors.nama_tambak.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="lokasi">Lokasi Tambak</Label>
        <Input
          id="lokasi"
          placeholder="Blok C, Indramayu"
          disabled={isLoading}
          {...register("lokasi")}
          className={errors.lokasi ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
        {errors.lokasi && (
          <p className="text-xs text-red-500">{errors.lokasi.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="luas_tambak">Luas Tambak (m²)</Label>
        <Input
          id="luas_tambak"
          type="number"
          placeholder="1000"
          disabled={isLoading}
          {...register("luas_tambak", { valueAsNumber: true })}
          className={errors.luas_tambak ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
        {errors.luas_tambak && (
          <p className="text-xs text-red-500">{errors.luas_tambak.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="keterangan">Keterangan Tambahan (Opsional)</Label>
        <Input
          id="keterangan"
          placeholder="Kepadatan benur tinggi, air payau"
          disabled={isLoading}
          {...register("keterangan")}
          className={errors.keterangan ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
        {errors.keterangan && (
          <p className="text-xs text-red-500">{errors.keterangan.message}</p>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="rounded-xl font-semibold border-slate-150 text-slate-600 w-full sm:w-auto"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
