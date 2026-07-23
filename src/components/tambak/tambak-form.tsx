"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Users } from "lucide-react";
import { tambakSchema, type TambakInput } from "@/validators/tambak";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePokdakan, type Anggota } from "@/context/pokdakan-context";

interface TambakFormProps {
  initialValues?: {
    nama_tambak: string;
    anggota_id?: string;
    lokasi?: string;
    luas_tambak: number;
    status_tambak?: "Aktif" | "Istirahat";
    keterangan?: string;
    catatan?: string;
  };
  onSubmit: (data: TambakInput) => void;
  isLoading: boolean;
  onCancel: () => void;
  submitLabel: string;
  hideAnggotaSelect?: boolean;
}

export default function TambakForm({
  initialValues,
  onSubmit,
  isLoading,
  onCancel,
  submitLabel,
  hideAnggotaSelect = false,
}: TambakFormProps) {
  const { anggotaList, activeAnggota } = usePokdakan();

  const defaultAnggotaId = initialValues?.anggota_id || activeAnggota?.anggota_id || (anggotaList.length > 0 ? anggotaList[0].anggota_id : "");
  const shouldHideAnggotaSelect = hideAnggotaSelect || !!activeAnggota;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TambakInput>({
    resolver: zodResolver(tambakSchema) as any,
    defaultValues: initialValues || {
      nama_tambak: "",
      anggota_id: defaultAnggotaId,
      lokasi: "",
      luas_tambak: "" as any,
      status_tambak: "Aktif",
      keterangan: "",
      catatan: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      {/* 1. Pemilik Tambak (Anggota Pokdakan) - Hidden if in personal mode */}
      {!shouldHideAnggotaSelect ? (
        <div className="space-y-1.5">
          <Label htmlFor="anggota_id" className="flex items-center gap-1.5 font-bold">
            <Users className="h-4 w-4 text-blue-600" /> Pemilik Tambak (Anggota Pokdakan) *
          </Label>
          <select
            id="anggota_id"
            disabled={isLoading || anggotaList.length === 0}
            {...register("anggota_id")}
            className={`w-full h-10 rounded-xl border px-3 text-xs font-medium bg-white text-slate-800 ${
              errors.anggota_id ? "border-red-500" : "border-slate-200"
            }`}
          >
            {anggotaList.length > 0 ? (
              anggotaList.map((a) => (
                <option key={a.anggota_id} value={a.anggota_id}>
                  {a.nama_anggota} {a.alamat ? `(${a.alamat})` : ""}
                </option>
              ))
            ) : (
              <option value="">(Belum Ada Anggota - Buat di Menu Data Anggota)</option>
            )}
          </select>
          {errors.anggota_id && (
            <p className="text-xs text-red-500">{errors.anggota_id.message}</p>
          )}
        </div>
      ) : (
        <input type="hidden" {...register("anggota_id")} />
      )}

      {/* 2. Nama Tambak */}
      <div className="space-y-1.5">
        <Label htmlFor="nama_tambak" className="font-bold">Nama Tambak *</Label>
        <Input
          id="nama_tambak"
          placeholder="Misal: Tambak Blok A, Tambak Selatan"
          disabled={isLoading}
          {...register("nama_tambak")}
          className={errors.nama_tambak ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
        {errors.nama_tambak && (
          <p className="text-xs text-red-500">{errors.nama_tambak.message}</p>
        )}
      </div>

      {/* 3. Luas Tambak */}
      <div className="space-y-1.5">
        <Label htmlFor="luas_tambak" className="font-bold">Luas Tambak (m²) *</Label>
        <Input
          id="luas_tambak"
          type="number"
          placeholder="10000"
          disabled={isLoading}
          {...register("luas_tambak", { valueAsNumber: true })}
          className={errors.luas_tambak ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
        {errors.luas_tambak && (
          <p className="text-xs text-red-500">{errors.luas_tambak.message}</p>
        )}
      </div>

      {/* 4. Lokasi */}
      <div className="space-y-1.5">
        <Label htmlFor="lokasi">Lokasi Tambak (Opsional)</Label>
        <Input
          id="lokasi"
          placeholder="Misal: Blok Krajan RT 02"
          disabled={isLoading}
          {...register("lokasi")}
          className={errors.lokasi ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
      </div>

      {/* 5. Status Tambak */}
      <div className="space-y-1.5">
        <Label htmlFor="status_tambak">Status Tambak</Label>
        <select
          id="status_tambak"
          disabled={isLoading}
          {...register("status_tambak")}
          className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700"
        >
          <option value="Aktif">Aktif (Sedang Berjalan/Siap)</option>
          <option value="Istirahat">Istirahat (Pengeringan / Maintenance)</option>
        </select>
      </div>

      {/* 6. Keterangan */}
      <div className="space-y-1.5">
        <Label htmlFor="keterangan">Catatan / Keterangan (Opsional)</Label>
        <Input
          id="keterangan"
          placeholder="Kepadatan tinggi, sumber air payau"
          disabled={isLoading}
          {...register("keterangan")}
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="rounded-xl font-semibold border-slate-200 text-slate-600 w-full sm:w-auto"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
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
