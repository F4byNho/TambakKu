"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  Calculator, 
  Calendar,
  AlertCircle
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatIDR, formatNumber, formatDate, formatDateForInput } from "@/lib/utils";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import { operasionalSchema, type OperasionalInput } from "@/validators/budidaya";
import { getCommodityConfig } from "@/lib/commodity-config";

interface OperasionalItem {
  operasional_id: string;
  siklus_id: string;
  user_id: string;
  tanggal: string;
  kategori: string;
  nominal: number;
  keterangan: string;
  komoditas_id?: string;
}

interface CycleOperasionalProps {
  siklusId: string;
  isCycleActive: boolean;
  komoditasId?: string;
  jenisKomoditas?: string;
  onDataChange?: () => void;
}

const TK_KEYWORDS = ["tenaga kerja", "upah", "gaji", "honor", "honorarium", " tk", "pekerja", "buruh"];
function isTKCategory(kategori: string): boolean {
  const k = (kategori || "").toLowerCase();
  return TK_KEYWORDS.some((kw) => k.includes(kw));
}

export default function CycleOperasional({ siklusId, isCycleActive, komoditasId, jenisKomoditas, onDataChange }: CycleOperasionalProps) {
  const [logs, setLogs] = useState<OperasionalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<OperasionalItem | null>(null);

  const [jenisBiayaAdd, setJenisBiayaAdd] = useState<"operasional" | "tenaga_kerja">("operasional");
  const [jenisBiayaEdit, setJenisBiayaEdit] = useState<"operasional" | "tenaga_kerja">("operasional");

  // Dialog controllers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Forms
  const {
    register: registerAdd,
    handleSubmit: handleAddSubmit,
    reset: resetAdd,
    formState: { errors: addErrors },
  } = useForm<OperasionalInput>({
    resolver: zodResolver(operasionalSchema) as any,
    defaultValues: {
      tanggal: new Date().toISOString().split("T")[0],
      kategori: "",
      nominal: "" as any,
      keterangan: "",
      komoditas_id: komoditasId || "",
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<OperasionalInput>({
    resolver: zodResolver(operasionalSchema) as any,
  });

  useEffect(() => {
    fetchOperasionalLogs();
  }, [siklusId, komoditasId]);

  const fetchOperasionalLogs = async () => {
    setIsLoading(true);
    try {
      const url = komoditasId 
        ? `/api/operasional?siklusId=${siklusId}&komoditasId=${komoditasId}`
        : `/api/operasional?siklusId=${siklusId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal mengambil data pengeluaran");
      const json = await res.json();
      setLogs(json.data || []);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat log");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total costs
  const totalCost = logs.reduce((sum, item) => sum + Number(item.nominal || 0), 0);

  const onAddSubmit = async (data: OperasionalInput) => {
    setIsSubmitting(true);
    try {
      let finalKategori = data.kategori.trim();
      if (jenisBiayaAdd === "tenaga_kerja" && !isTKCategory(finalKategori)) {
        finalKategori = `Tenaga Kerja - ${finalKategori}`;
      }

      const res = await fetch("/api/operasional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siklusId, ...data, kategori: finalKategori, komoditas_id: komoditasId || "" }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal mencatat pengeluaran");

      toast.success("Biaya pengeluaran berhasil dicatat!");
      setIsAddOpen(false);
      resetAdd({
        tanggal: new Date().toISOString().split("T")[0],
        kategori: "",
        nominal: "" as any,
        keterangan: "",
        komoditas_id: komoditasId || "",
      });
      setJenisBiayaAdd("operasional");
      fetchOperasionalLogs();
      onDataChange?.();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEditSubmit = async (data: OperasionalInput) => {
    if (!selectedLog) return;
    setIsSubmitting(true);
    try {
      let finalKategori = data.kategori.trim();
      if (jenisBiayaEdit === "tenaga_kerja" && !isTKCategory(finalKategori)) {
        finalKategori = `Tenaga Kerja - ${finalKategori}`;
      }

      const res = await fetch(`/api/operasional/${selectedLog.operasional_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, kategori: finalKategori, komoditas_id: komoditasId || "" }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal memperbarui data");

      toast.success("Data pengeluaran berhasil diperbarui!");
      setIsEditOpen(false);
      setSelectedLog(null);
      fetchOperasionalLogs();
      onDataChange?.();
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDeleteConfirm = async () => {
    if (!selectedLog) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/operasional/${selectedLog.operasional_id}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menghapus data");

      toast.success("Catatan pengeluaran berhasil dihapus!");
      setIsDeleteOpen(false);
      setSelectedLog(null);
      fetchOperasionalLogs();
      onDataChange?.();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (log: OperasionalItem) => {
    setSelectedLog(log);
    const isTK = isTKCategory(log.kategori);
    setJenisBiayaEdit(isTK ? "tenaga_kerja" : "operasional");
    const rawDate = log.tanggal || (log as any).tanggal_operasional;
    resetEdit({
      tanggal: formatDateForInput(rawDate),
      kategori: log.kategori as any,
      nominal: log.nominal,
      keterangan: log.keterangan,
      komoditas_id: komoditasId || "",
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (log: OperasionalItem) => {
    setSelectedLog(log);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* KPI Sum Card & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Biaya Pengeluaran {jenisKomoditas ? getCommodityConfig(jenisKomoditas).name : "Siklus Tambak"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {jenisKomoditas 
              ? `Catatan pengeluaran operasional & upah kerja khusus untuk komoditas ${getCommodityConfig(jenisKomoditas).name.toLowerCase()} (seperti pakan, pupuk, jasa panen).`
              : "Catatan pengeluaran operasional & pemeliharaan umum 1 tambak (seperti keduk teplok, solar, genset, listrik) yang digunakan bersama."
            }
          </p>
        </div>
        {isCycleActive && (
          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-2xs h-10 px-4 text-xs text-white shrink-0 w-full sm:w-auto gap-1.5"
          >
            <Plus className="h-4 w-4" /> Tambah Pengeluaran
          </Button>
        )}
      </div>

      {/* Rangkuman total biaya operasional */}
      <Card className="border-blue-100 bg-blue-50/20 shadow-none rounded-xl">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm shrink-0">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Biaya Pengeluaran</p>
              {isLoading ? (
                <div className="flex items-center gap-2 mt-1 h-7">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-400">Memuat total...</span>
                </div>
              ) : (
                <p className="text-xl font-black text-slate-900 mt-0.5">{formatIDR(totalCost)}</p>
              )}
            </div>
          </div>
          <div className="text-xs text-slate-400">
            {jenisKomoditas 
              ? `*Pengeluaran khusus komoditas ${getCommodityConfig(jenisKomoditas).name.toLowerCase()} di luar pembelian bibit/benur.`
              : "*Gabungan pengeluaran operasional & pemeliharaan umum 1 tambak di luar bibit/benur."
            }
          </div>
        </CardContent>
      </Card>

      {/* Card Grid */}
      <Card className="border-slate-100 shadow-none rounded-xl">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-xs text-slate-500 font-semibold">Memuat riwayat pengeluaran...</p>
            </div>
          </div>
        ) : logs.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {logs.map((log) => (
              <Card
                key={log.operasional_id}
                className="transition-all shadow-2xs hover:shadow-md rounded-2xl p-4 flex flex-col justify-between bg-white border border-slate-200 hover:border-blue-300"
              >
                <div className="space-y-3">
                  {/* Header: Tanggal & Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      <Calendar className="h-3 w-3" />
                      {formatDate(log.tanggal || (log as any).tanggal_operasional)}
                    </span>
                    {isCycleActive && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(log)}
                          className="h-7 w-7 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(log)}
                          className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Kategori & Keterangan */}
                  <div>
                    <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 border border-slate-150/10">
                      {log.kategori}
                    </span>
                    {log.keterangan && (
                      <p className="text-[11px] text-slate-400 italic mt-1.5 truncate">{log.keterangan}</p>
                    )}
                  </div>

                  {/* Nominal */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50/60 border border-blue-100/80">
                    <span className="text-xs text-slate-500 font-semibold">Nominal:</span>
                    <span className="font-black text-slate-900 text-xs">{formatIDR(log.nominal)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3 shadow-inner">
              <Calculator className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-0.5">Belum Ada Biaya Pengeluaran</h4>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              {jenisKomoditas
                ? `Biaya pengeluaran khusus ${getCommodityConfig(jenisKomoditas).name.toLowerCase()} belum dicatat.`
                : "Biaya pengeluaran operasional & pemeliharaan umum 1 tambak belum dicatat pada siklus ini."
              }
            </p>
          </div>
        )}
      </Card>

      {/* dialogs */}

      {/* 1. Add Log Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-100 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Catat Pengeluaran</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Masukkan detail nominal pengeluaran biaya Anda.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit(onAddSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal Pengeluaran</Label>
              <Input
                id="tanggal"
                type="date"
                disabled={isSubmitting}
                {...registerAdd("tanggal")}
                className={addErrors.tanggal ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {addErrors.tanggal && (
                <p className="text-xs text-red-500">{addErrors.tanggal.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="jenis_biaya">Kelompok / Jenis Pengeluaran</Label>
              <select
                id="jenis_biaya"
                value={jenisBiayaAdd}
                onChange={(e) => setJenisBiayaAdd(e.target.value as "operasional" | "tenaga_kerja")}
                disabled={isSubmitting}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50"
              >
                <option value="operasional">Pengeluaran Operasional</option>
                <option value="tenaga_kerja">Pengeluaran Tenaga Kerja</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kategori">Nama / Detail Pengeluaran</Label>
              <Input
                id="kategori"
                placeholder={jenisBiayaAdd === "tenaga_kerja" ? "Misal: Upah Panen Udang, Gaji Pekerja" : "Misal: Keduk Teplok, Saponin, Pakan"}
                disabled={isSubmitting}
                {...registerAdd("kategori")}
                className={addErrors.kategori ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {addErrors.kategori && (
                <p className="text-xs text-red-500">{addErrors.kategori.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nominal">Nominal Biaya (Rp)</Label>
              <Input
                id="nominal"
                type="number"
                placeholder="100000"
                disabled={isSubmitting}
                {...registerAdd("nominal", { valueAsNumber: true })}
                className={addErrors.nominal ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {addErrors.nominal && (
                <p className="text-xs text-red-500">{addErrors.nominal.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan Opsional</Label>
              <Input
                id="keterangan"
                placeholder="Catatan tambahan (misal: Beli 2 karung pakan / 3 pekerja harian)"
                disabled={isSubmitting}
                {...registerAdd("keterangan")}
                className={addErrors.keterangan ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {addErrors.keterangan && (
                <p className="text-xs text-red-500">{addErrors.keterangan.message}</p>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={isSubmitting}
                className="rounded-xl font-semibold border-slate-150 text-slate-600 w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Edit Log Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-100 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Ubah Data Pengeluaran</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Perbarui rincian data pengeluaran operasional Anda.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit_tanggal">Tanggal Pengeluaran</Label>
              <Input
                id="edit_tanggal"
                type="date"
                disabled={isSubmitting}
                {...registerEdit("tanggal")}
                className={editErrors.tanggal ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {editErrors.tanggal && (
                <p className="text-xs text-red-500">{editErrors.tanggal.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_jenis_biaya">Kelompok / Jenis Pengeluaran</Label>
              <select
                id="edit_jenis_biaya"
                value={jenisBiayaEdit}
                onChange={(e) => setJenisBiayaEdit(e.target.value as "operasional" | "tenaga_kerja")}
                disabled={isSubmitting}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50"
              >
                <option value="operasional">Pengeluaran Operasional</option>
                <option value="tenaga_kerja">Pengeluaran Tenaga Kerja</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_kategori">Nama / Detail Pengeluaran</Label>
              <Input
                id="edit_kategori"
                placeholder={jenisBiayaEdit === "tenaga_kerja" ? "Misal: Upah Panen Udang, Gaji Pekerja" : "Misal: Keduk Teplok, Saponin, Pakan"}
                disabled={isSubmitting}
                {...registerEdit("kategori")}
                className={editErrors.kategori ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {editErrors.kategori && (
                <p className="text-xs text-red-500">{editErrors.kategori.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_nominal">Nominal Biaya (Rp)</Label>
              <Input
                id="edit_nominal"
                type="number"
                placeholder="100000"
                disabled={isSubmitting}
                {...registerEdit("nominal", { valueAsNumber: true })}
                className={editErrors.nominal ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {editErrors.nominal && (
                <p className="text-xs text-red-500">{editErrors.nominal.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_keterangan">Keterangan Opsional</Label>
              <Input
                id="edit_keterangan"
                placeholder="Catatan tambahan"
                disabled={isSubmitting}
                {...registerEdit("keterangan")}
                className={editErrors.keterangan ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {editErrors.keterangan && (
                <p className="text-xs text-red-500">{editErrors.keterangan.message}</p>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditOpen(false);
                  setSelectedLog(null);
                }}
                disabled={isSubmitting}
                className="rounded-xl font-semibold border-slate-150 text-slate-600 w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Perbarui"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedLog(null);
        }}
        onConfirm={onDeleteConfirm}
        title="Hapus Catatan Pengeluaran?"
        description={`Apakah Anda yakin ingin menghapus catatan pengeluaran "${selectedLog?.kategori}" sebesar ${formatIDR(selectedLog?.nominal || 0)} ini?`}
        isLoading={isSubmitting}
      />
    </div>
  );
}
