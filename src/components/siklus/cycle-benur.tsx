"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  Layers, 
  Calendar,
  AlertCircle
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatIDR, formatNumber, formatDate, formatDateForInput } from "@/lib/utils";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import { benurSchema, type BenurInput } from "@/validators/budidaya";
import { getCommodityConfig } from "@/lib/commodity-config";

interface BenurItem {
  benur_id: string;
  siklus_id: string;
  user_id: string;
  tanggal_tebar: string;
  jenis_udang: string;
  ukuran_PL: string;
  asal_benih?: string;
  jumlah_benur: number;
  harga_per_ekor: number;
  total_harga: number;
}

interface CycleBenurProps {
  siklusId: string;
  isCycleActive: boolean;
  komoditasId: string;
  jenisKomoditas: string;
  namaKomoditas?: string;
  onDataChange?: () => void;
}

export default function CycleBenur({ siklusId, isCycleActive, komoditasId, jenisKomoditas, namaKomoditas, onDataChange }: CycleBenurProps) {
  const [logs, setLogs] = useState<BenurItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<BenurItem | null>(null);

  // Dialog controllers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const config = getCommodityConfig(jenisKomoditas);

  const defaultVarietas = namaKomoditas || (jenisKomoditas === "udang" ? "Vaname" : jenisKomoditas === "rumput_laut" ? "Gracilaria" : "Bandeng");

  // Forms
  const {
    register: registerAdd,
    handleSubmit: handleAddSubmit,
    reset: resetAdd,
    control: controlAdd,
    formState: { errors: addErrors },
  } = useForm<BenurInput>({
    resolver: zodResolver(benurSchema) as any,
    defaultValues: {
      tanggal_tebar: new Date().toISOString().split("T")[0],
      jenis_udang: defaultVarietas,
      ukuran_PL: "",
      asal_benih: "",
      jumlah_benur: "" as any,
      harga_per_ekor: "" as any,
      komoditas_id: komoditasId,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    control: controlEdit,
    formState: { errors: editErrors },
  } = useForm<BenurInput>({
    resolver: zodResolver(benurSchema) as any,
  });

  // Real-time Total Price calculation preview using useWatch
  const addQty = useWatch({ control: controlAdd, name: "jumlah_benur" }) || 0;
  const addPrice = useWatch({ control: controlAdd, name: "harga_per_ekor" }) || 0;
  const previewTotalAdd = Number(addQty) * Number(addPrice);

  const editQty = useWatch({ control: controlEdit, name: "jumlah_benur" }) || 0;
  const editPrice = useWatch({ control: controlEdit, name: "harga_per_ekor" }) || 0;
  const previewTotalEdit = Number(editQty) * Number(editPrice);

  useEffect(() => {
    fetchBenurLogs();
    resetAdd({
      tanggal_tebar: new Date().toISOString().split("T")[0],
      jenis_udang: defaultVarietas,
      ukuran_PL: "",
      asal_benih: "",
      jumlah_benur: "" as any,
      harga_per_ekor: "" as any,
      komoditas_id: komoditasId,
    });
  }, [siklusId, komoditasId, namaKomoditas]);

  const fetchBenurLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/benur?siklusId=${siklusId}&komoditasId=${komoditasId}`);
      if (!res.ok) throw new Error("Gagal mengambil data penebaran/penanaman");
      const json = await res.json();
      setLogs(json.data || []);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat log");
    } finally {
      setIsLoading(false);
    }
  };

  const onAddSubmit = async (data: BenurInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/benur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siklusId, ...data, komoditas_id: komoditasId }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan data");

      toast.success("Catatan penebaran/penanaman berhasil disimpan!");
      setIsAddOpen(false);
      resetAdd({
        tanggal_tebar: new Date().toISOString().split("T")[0],
        jenis_udang: defaultVarietas,
        ukuran_PL: "",
        jumlah_benur: "" as any,
        harga_per_ekor: "" as any,
        komoditas_id: komoditasId,
      });
      fetchBenurLogs();
      onDataChange?.();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEditSubmit = async (data: BenurInput) => {
    if (!selectedLog) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/benur/${selectedLog.benur_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, komoditas_id: komoditasId }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal memperbarui data");

      toast.success("Data penebaran/penanaman berhasil diperbarui!");
      setIsEditOpen(false);
      setSelectedLog(null);
      fetchBenurLogs();
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
      const res = await fetch(`/api/benur/${selectedLog.benur_id}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menghapus data");

      toast.success("Catatan penebaran/penanaman berhasil dihapus!");
      setIsDeleteOpen(false);
      setSelectedLog(null);
      fetchBenurLogs();
      onDataChange?.();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (log: BenurItem) => {
    setSelectedLog(log);
    const rawDate = log.tanggal_tebar || (log as any).tanggal;
    resetEdit({
      tanggal_tebar: formatDateForInput(rawDate),
      jenis_udang: log.jenis_udang,
      ukuran_PL: log.ukuran_PL,
      asal_benih: log.asal_benih || "",
      jumlah_benur: log.jumlah_benur,
      harga_per_ekor: log.harga_per_ekor,
      komoditas_id: komoditasId,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (log: BenurItem) => {
    setSelectedLog(log);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Riwayat {config.stockingLabel}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Daftar pencatatan bibit {config.name.toLowerCase()} yang dilepas pada siklus ini.
          </p>
        </div>
        {isCycleActive && (
          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-2xs h-10 px-4 text-xs text-white shrink-0 w-full sm:w-auto gap-1.5"
          >
            <Plus className="h-4 w-4" /> Catat {config.stockingLabel}
          </Button>
        )}
      </div>

      {/* Card Grid */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            <p className="text-xs text-slate-500 font-bold">Memuat riwayat penebaran bibit...</p>
          </div>
        </div>
      ) : logs.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {logs.map((log) => (
            <Card
              key={log.benur_id}
              className="transition-all shadow-2xs hover:shadow-md rounded-2xl p-4 flex flex-col justify-between bg-white border border-slate-200 hover:border-blue-300"
            >
              <div className="space-y-3">
                {/* Header: Tanggal & Actions */}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    <Calendar className="h-3 w-3" />
                    {formatDate(log.tanggal_tebar || (log as any).tanggal)}
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

                {/* Varietas, Ukuran & Asal Benih */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 capitalize">{log.jenis_udang}</h4>
                  <div className="mt-1 space-y-0.5">
                    <p className="text-xs text-slate-500 font-medium">
                      Ukuran: <span className="font-bold text-slate-700">{log.ukuran_PL}</span>
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      Asal Benih: <span className="font-bold text-slate-800">{log.asal_benih || "-"}</span>
                    </p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50/60 border border-blue-100/80">
                    <span className="text-xs text-slate-500 font-semibold">{config.stockingQtyLabel}:</span>
                    <span className="font-black text-blue-700 text-xs">{formatNumber(log.jumlah_benur)} {config.stockingQtyUnit}</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100/80">
                    <span className="text-xs text-slate-500 font-semibold">{config.stockingPriceLabel}:</span>
                    <span className="font-bold text-slate-700 text-xs">{formatIDR(log.harga_per_ekor)}</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100/80">
                    <span className="text-xs text-slate-600 font-bold">Total Biaya:</span>
                    <span className="font-black text-slate-900 text-xs">{formatIDR(log.total_harga)}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3 shadow-inner">
            <Layers className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-0.5">Belum Ada {config.stockingLabel}</h4>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            Pencatatan {config.stockingLabel.toLowerCase()} pada siklus ini belum dicatat. Silakan lakukan pencatatan tebar/tanam baru.
          </p>
        </div>
      )}

      {/* dialogs */}

      {/* 1. Add Log Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-100 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Catat {config.stockingLabel}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Masukkan detail pembelian dan pelepasan {config.name.toLowerCase()} Anda.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit(onAddSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="tanggal_tebar">{config.stockingDateLabel}</Label>
              <Input
                id="tanggal_tebar"
                type="date"
                disabled={isSubmitting}
                {...registerAdd("tanggal_tebar")}
                className={addErrors.tanggal_tebar ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {addErrors.tanggal_tebar && (
                <p className="text-xs text-red-500">{addErrors.tanggal_tebar.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="jenis_udang">{config.stockingNameLabel}</Label>
                <Input
                  id="jenis_udang"
                  placeholder={config.stockingNamePlaceholder}
                  disabled={isSubmitting}
                  {...registerAdd("jenis_udang")}
                  className={addErrors.jenis_udang ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {addErrors.jenis_udang && (
                  <p className="text-xs text-red-500">{addErrors.jenis_udang.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ukuran_PL">{config.stockingSizeLabel}</Label>
                <Input
                  id="ukuran_PL"
                  placeholder={config.stockingSizePlaceholder}
                  disabled={isSubmitting}
                  {...registerAdd("ukuran_PL")}
                  className={addErrors.ukuran_PL ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {addErrors.ukuran_PL && (
                  <p className="text-xs text-red-500">{addErrors.ukuran_PL.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="asal_benih">Asal Benih / Bibit</Label>
              <Input
                id="asal_benih"
                placeholder="misal: Hatchery Situbondo / PT STP"
                disabled={isSubmitting}
                {...registerAdd("asal_benih")}
                className={addErrors.asal_benih ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {addErrors.asal_benih && (
                <p className="text-xs text-red-500">{addErrors.asal_benih.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="jumlah_benur">{config.stockingQtyLabel}</Label>
                <Input
                  id="jumlah_benur"
                  type="number"
                  placeholder="50000"
                  disabled={isSubmitting}
                  {...registerAdd("jumlah_benur", { valueAsNumber: true })}
                  className={addErrors.jumlah_benur ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {addErrors.jumlah_benur && (
                  <p className="text-xs text-red-500">{addErrors.jumlah_benur.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="harga_per_ekor">{config.stockingPriceLabel}</Label>
                <Input
                  id="harga_per_ekor"
                  type="number"
                  placeholder="50"
                  disabled={isSubmitting}
                  {...registerAdd("harga_per_ekor", { valueAsNumber: true })}
                  className={addErrors.harga_per_ekor ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {addErrors.harga_per_ekor && (
                  <p className="text-xs text-red-500">{addErrors.harga_per_ekor.message}</p>
                )}
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="rounded-xl border border-blue-50 bg-blue-50/30 p-3.5 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-blue-800 font-bold">
                <AlertCircle className="h-4.5 w-4.5" />
                Estimasi Total Harga:
              </div>
              <div className="text-blue-900 font-black text-base">
                {formatIDR(previewTotalAdd)}
              </div>
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
            <DialogTitle className="text-lg font-bold text-slate-900">Ubah Data {config.stockingLabel}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Perbarui catatan pembelian/penebaran {config.name.toLowerCase()} Anda.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit_tanggal_tebar">{config.stockingDateLabel}</Label>
              <Input
                id="edit_tanggal_tebar"
                type="date"
                disabled={isSubmitting}
                {...registerEdit("tanggal_tebar")}
                className={editErrors.tanggal_tebar ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {editErrors.tanggal_tebar && (
                <p className="text-xs text-red-500">{editErrors.tanggal_tebar.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit_jenis_udang">{config.stockingNameLabel}</Label>
                <Input
                  id="edit_jenis_udang"
                  placeholder={config.stockingNamePlaceholder}
                  disabled={isSubmitting}
                  {...registerEdit("jenis_udang")}
                  className={editErrors.jenis_udang ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {editErrors.jenis_udang && (
                  <p className="text-xs text-red-500">{editErrors.jenis_udang.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_ukuran_PL">{config.stockingSizeLabel}</Label>
                <Input
                  id="edit_ukuran_PL"
                  placeholder={config.stockingSizePlaceholder}
                  disabled={isSubmitting}
                  {...registerEdit("ukuran_PL")}
                  className={editErrors.ukuran_PL ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {editErrors.ukuran_PL && (
                  <p className="text-xs text-red-500">{editErrors.ukuran_PL.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_asal_benih">Asal Benih / Bibit</Label>
              <Input
                id="edit_asal_benih"
                placeholder="misal: Hatchery Situbondo / PT STP"
                disabled={isSubmitting}
                {...registerEdit("asal_benih")}
                className={editErrors.asal_benih ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {editErrors.asal_benih && (
                <p className="text-xs text-red-500">{editErrors.asal_benih.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit_jumlah_benur">{config.stockingQtyLabel}</Label>
                <Input
                  id="edit_jumlah_benur"
                  type="number"
                  placeholder="50000"
                  disabled={isSubmitting}
                  {...registerEdit("jumlah_benur", { valueAsNumber: true })}
                  className={editErrors.jumlah_benur ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {editErrors.jumlah_benur && (
                  <p className="text-xs text-red-500">{editErrors.jumlah_benur.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_harga_per_ekor">{config.stockingPriceLabel}</Label>
                <Input
                  id="edit_harga_per_ekor"
                  type="number"
                  placeholder="50"
                  disabled={isSubmitting}
                  {...registerEdit("harga_per_ekor", { valueAsNumber: true })}
                  className={editErrors.harga_per_ekor ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {editErrors.harga_per_ekor && (
                  <p className="text-xs text-red-500">{editErrors.harga_per_ekor.message}</p>
                )}
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="rounded-xl border border-blue-50 bg-blue-50/30 p-3.5 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-blue-800 font-bold">
                <AlertCircle className="h-4.5 w-4.5" />
                Estimasi Total Harga:
              </div>
              <div className="text-blue-900 font-black text-base">
                {formatIDR(previewTotalEdit)}
              </div>
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
        title={`Hapus Catatan ${config.stockingLabel}?`}
        description={`Apakah Anda yakin ingin menghapus catatan "${selectedLog?.jenis_udang} - ${selectedLog?.ukuran_PL}" sebanyak ${formatNumber(selectedLog?.jumlah_benur || 0)} ${config.stockingQtyUnit} ini? Data biaya tebar/tanam akan terhapus dari neraca modal.`}
        isLoading={isSubmitting}
      />
    </div>
  );
}
