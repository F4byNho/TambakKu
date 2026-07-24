"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  TrendingUp, 
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
import { formatIDR, formatNumber, formatDate, formatDateForInput, getTodayDateString } from "@/lib/utils";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import { panenSchema, type PanenInput } from "@/validators/budidaya";
import { getCommodityConfig } from "@/lib/commodity-config";

interface PanenItem {
  panen_id: string;
  siklus_id: string;
  user_id: string;
  tanggal: string;
  berat_panen: number;
  harga_jual: number;
  pendapatan: number;
  size?: number;
  jumlah_ekor?: number;
  sr_percent?: number;
}

interface CyclePanenProps {
  siklusId: string;
  isCycleActive: boolean;
  komoditasId: string;
  jenisKomoditas: string;
  onDataChange?: () => void;
}

export default function CyclePanen({ siklusId, isCycleActive, komoditasId, jenisKomoditas, onDataChange }: CyclePanenProps) {
  const [logs, setLogs] = useState<PanenItem[]>([]);
  const [totalBenurTebar, setTotalBenurTebar] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<PanenItem | null>(null);

  // Dialog controllers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const config = getCommodityConfig(jenisKomoditas);

  // Forms
  const {
    register: registerAdd,
    handleSubmit: handleAddSubmit,
    reset: resetAdd,
    control: controlAdd,
    formState: { errors: addErrors },
  } = useForm<PanenInput>({
    resolver: zodResolver(panenSchema) as any,
    defaultValues: {
      tanggal: getTodayDateString(),
      berat_panen: "" as any,
      size: "" as any,
      harga_jual: "" as any,
      komoditas_id: komoditasId,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    control: controlEdit,
    formState: { errors: editErrors },
  } = useForm<PanenInput>({
    resolver: zodResolver(panenSchema) as any,
  });

  // Watch values for real-time calculations preview (Add)
  const addQty = useWatch({ control: controlAdd, name: "berat_panen" }) || 0;
  const addSize = useWatch({ control: controlAdd, name: "size" }) || 0;
  const addPrice = useWatch({ control: controlAdd, name: "harga_jual" }) || 0;

  const addJumlahUdangPanen = (Number(addQty) || 0) * (Number(addSize) || 0);
  const addSR = totalBenurTebar > 0 ? (addJumlahUdangPanen / totalBenurTebar) * 100 : 0;
  const previewRevenueAdd = (Number(addQty) || 0) * (Number(addPrice) || 0);

  // Watch values for real-time calculations preview (Edit)
  const editQty = useWatch({ control: controlEdit, name: "berat_panen" }) || 0;
  const editSize = useWatch({ control: controlEdit, name: "size" }) || 0;
  const editPrice = useWatch({ control: controlEdit, name: "harga_jual" }) || 0;

  const editJumlahUdangPanen = (Number(editQty) || 0) * (Number(editSize) || 0);
  const editSR = totalBenurTebar > 0 ? (editJumlahUdangPanen / totalBenurTebar) * 100 : 0;
  const previewRevenueEdit = (Number(editQty) || 0) * (Number(editPrice) || 0);

  useEffect(() => {
    fetchPanenLogs();
    fetchBenurLogs();
  }, [siklusId, komoditasId]);

  const fetchBenurLogs = async () => {
    try {
      const res = await fetch(`/api/benur?siklusId=${siklusId}`);
      if (!res.ok) return;
      const json = await res.json();
      const benurs: any[] = json.data || [];
      const filteredBenurs = benurs.filter(b => !komoditasId || !b.komoditas_id || b.komoditas_id === komoditasId);
      const sumBenur = filteredBenurs.reduce((acc, b) => acc + Number(b.jumlah_benur || 0), 0);
      setTotalBenurTebar(sumBenur);
    } catch (err) {
      console.error("Gagal mengambil data benur tebar:", err);
    }
  };

  const fetchPanenLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/panen?siklusId=${siklusId}&komoditasId=${komoditasId}`);
      if (!res.ok) throw new Error("Gagal mengambil data panen");
      const json = await res.json();
      setLogs(json.data || []);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat log panen");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate cumulative stats
  const totalWeight = logs.reduce((sum, item) => sum + Number(item.berat_panen || 0), 0);
  const totalRevenue = logs.reduce((sum, item) => sum + Number(item.pendapatan || 0), 0);

  const onAddSubmit = async (data: PanenInput) => {
    setIsSubmitting(true);
    const calculatedJumlahEkor = (Number(data.berat_panen) || 0) * (Number(data.size) || 0);
    const calculatedSR = totalBenurTebar > 0 ? (calculatedJumlahEkor / totalBenurTebar) * 100 : 0;
    const calculatedPendapatan = (Number(data.berat_panen) || 0) * (Number(data.harga_jual) || 0);

    try {
      const res = await fetch("/api/panen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          siklusId, 
          ...data, 
          komoditas_id: komoditasId,
          jumlah_ekor: calculatedJumlahEkor,
          pendapatan: calculatedPendapatan,
          sr_percent: Number(calculatedSR.toFixed(2)),
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal mencatat panen");

      toast.success("Catatan hasil panen berhasil disimpan!");
      setIsAddOpen(false);
      resetAdd({
        tanggal: getTodayDateString(),
        berat_panen: "" as any,
        size: "" as any,
        harga_jual: "" as any,
        komoditas_id: komoditasId,
      });
      await fetchBenurLogs();
      await fetchPanenLogs();
      onDataChange?.();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEditSubmit = async (data: PanenInput) => {
    if (!selectedLog) return;
    setIsSubmitting(true);
    const calculatedJumlahEkor = (Number(data.berat_panen) || 0) * (Number(data.size) || 0);
    const calculatedSR = totalBenurTebar > 0 ? (calculatedJumlahEkor / totalBenurTebar) * 100 : 0;
    const calculatedPendapatan = (Number(data.berat_panen) || 0) * (Number(data.harga_jual) || 0);

    try {
      const res = await fetch(`/api/panen/${selectedLog.panen_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...data, 
          komoditas_id: komoditasId,
          jumlah_ekor: calculatedJumlahEkor,
          pendapatan: calculatedPendapatan,
          sr_percent: Number(calculatedSR.toFixed(2)),
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal memperbarui data");

      toast.success("Data hasil panen berhasil diperbarui!");
      setIsEditOpen(false);
      setSelectedLog(null);
      fetchPanenLogs();
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
      const res = await fetch(`/api/panen/${selectedLog.panen_id}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menghapus data");

      toast.success("Catatan hasil panen berhasil dihapus!");
      setIsDeleteOpen(false);
      setSelectedLog(null);
      fetchPanenLogs();
      onDataChange?.();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (log: PanenItem) => {
    setSelectedLog(log);
    const rawDate = (log as any).tanggal_panen || log.tanggal;
    resetEdit({
      tanggal: formatDateForInput(rawDate),
      berat_panen: log.berat_panen,
      size: log.size || ("" as any),
      harga_jual: log.harga_jual,
      komoditas_id: komoditasId,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (log: PanenItem) => {
    setSelectedLog(log);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {config.harvestLabel}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Log hasil panen {config.name.toLowerCase()} beserta pendapatan yang diterima.
          </p>
        </div>
        {isCycleActive && (
          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-2xs h-10 px-4 text-xs text-white shrink-0 w-full sm:w-auto gap-1.5"
          >
            <Plus className="h-4 w-4" /> Catat Hasil Panen
          </Button>
        )}
      </div>

      {/* Card Grid */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <p className="text-xs text-slate-500 font-semibold">Memuat riwayat panen...</p>
          </div>
        </div>
      ) : logs.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {logs.map((log) => {
            const calculatedUdang = log.jumlah_ekor || (log.size ? Number(log.berat_panen) * Number(log.size) : undefined);
            const rawSR = Number(log.sr_percent);
            const calculatedSR = (log.sr_percent !== undefined && !isNaN(rawSR) && rawSR > 0)
              ? rawSR 
              : (totalBenurTebar > 0 && calculatedUdang ? (calculatedUdang / totalBenurTebar) * 100 : (!isNaN(rawSR) ? rawSR : undefined));

            return (
              <Card
                key={log.panen_id}
                className="transition-all shadow-2xs hover:shadow-md rounded-2xl p-4 flex flex-col justify-between bg-white border border-slate-200 hover:border-emerald-300"
              >
                <div className="space-y-3">
                  {/* Header: Tanggal & Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <Calendar className="h-3 w-3" />
                      {formatDate((log as any).tanggal_panen || log.tanggal)}
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

                  {/* Metrics */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50/60 border border-emerald-100/80">
                      <span className="text-xs text-slate-500 font-semibold">{config.harvestWeightLabel}:</span>
                      <span className="font-black text-emerald-700 text-xs">{formatNumber(log.berat_panen)} kg</span>
                    </div>

                    {jenisKomoditas !== "rumput_laut" && log.size ? (
                      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100/80">
                        <span className="text-xs text-slate-500 font-semibold">Size:</span>
                        <span className="font-bold text-slate-800 text-xs font-mono">{log.size} ekor/kg</span>
                      </div>
                    ) : null}

                    {jenisKomoditas !== "rumput_laut" && calculatedUdang ? (
                      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100/80">
                        <span className="text-xs text-slate-500 font-semibold">Est. Jumlah Udang:</span>
                        <span className="font-bold text-slate-800 text-xs font-mono">{formatNumber(calculatedUdang)} ekor</span>
                      </div>
                    ) : null}

                    {jenisKomoditas !== "rumput_laut" && (jenisKomoditas === "udang" || calculatedSR !== undefined) && (
                      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50/70 border border-blue-100">
                        <span className="text-xs text-blue-700 font-bold">Survival Rate (SR %):</span>
                        <span className="font-black text-blue-800 text-xs font-mono">
                          {calculatedSR !== undefined 
                            ? `${Number(calculatedSR).toFixed(2).replace(".", ",")}%`
                            : "-"}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100/80">
                      <span className="text-xs text-slate-500 font-semibold">{config.harvestPriceLabel}:</span>
                      <span className="font-bold text-slate-700 text-xs">{formatIDR(log.harga_jual)} / kg</span>
                    </div>

                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                      <span className="text-xs text-slate-600 font-bold">Total Pendapatan:</span>
                      <span className="font-black text-emerald-700 text-xs">{formatIDR(log.pendapatan)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3 shadow-inner">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-0.5">Belum Ada Catatan Panen</h4>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            Pencatatan hasil panen {config.name.toLowerCase()} belum dilakukan. Silakan catat panen yang telah dicapai.
          </p>
        </div>
      )}

      {/* 1. Add Log Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-100 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Catat {config.harvestLabel}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Masukkan hasil panen komoditas {config.name.toLowerCase()} Anda.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit(onAddSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal Panen</Label>
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

            <div className={jenisKomoditas !== "rumput_laut" ? "grid grid-cols-2 gap-3" : "space-y-2"}>
              <div className="space-y-2">
                <Label htmlFor="berat_panen">{config.harvestWeightLabel}</Label>
                <Input
                  id="berat_panen"
                  type="number"
                  placeholder="500"
                  disabled={isSubmitting}
                  {...registerAdd("berat_panen", { valueAsNumber: true })}
                  className={addErrors.berat_panen ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {addErrors.berat_panen && (
                  <p className="text-xs text-red-500">{addErrors.berat_panen.message}</p>
                )}
              </div>

              {jenisKomoditas !== "rumput_laut" && (
                <div className="space-y-2">
                  <Label htmlFor="size">Size (ekor/kg)</Label>
                  <Input
                    id="size"
                    type="number"
                    placeholder="100"
                    disabled={isSubmitting}
                    {...registerAdd("size", { valueAsNumber: true })}
                    className={addErrors.size ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {addErrors.size && (
                    <p className="text-xs text-red-500">{addErrors.size.message}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="harga_jual">{config.harvestPriceLabel}</Label>
              <Input
                id="harga_jual"
                type="number"
                placeholder="85000"
                disabled={isSubmitting}
                {...registerAdd("harga_jual", { valueAsNumber: true })}
                className={addErrors.harga_jual ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {addErrors.harga_jual && (
                <p className="text-xs text-red-500">{addErrors.harga_jual.message}</p>
              )}
            </div>

            {/* Realtime Automatic Indicators Box */}
            <div className="space-y-2 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
              {jenisKomoditas !== "rumput_laut" && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Estimasi Jumlah Udang Panen:</span>
                    <span className="font-black text-slate-900 font-mono">
                      {addJumlahUdangPanen > 0 ? `${formatNumber(addJumlahUdangPanen)} ekor` : "0 ekor"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Survival Rate (SR):</span>
                    <span className={`font-black font-mono px-2 py-0.5 rounded-md text-xs ${addSR >= 70 ? "bg-emerald-100 text-emerald-800" : addSR > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                      {totalBenurTebar > 0 
                        ? `${addSR.toFixed(2).replace('.', ',')}%`
                        : addJumlahUdangPanen > 0 
                        ? "Belum ada benur tebar"
                        : "0%"
                      }
                    </span>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-blue-100/80">
                <span className="font-bold text-blue-900">Estimasi Pendapatan:</span>
                <span className="font-black text-blue-700 text-sm font-mono">
                  {formatIDR(previewRevenueAdd)}
                </span>
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
            <DialogTitle className="text-lg font-bold text-slate-900">Ubah Data {config.harvestLabel}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Perbarui catatan hasil panen Anda.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit_tanggal">Tanggal Panen</Label>
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

            <div className={jenisKomoditas !== "rumput_laut" ? "grid grid-cols-2 gap-3" : "space-y-2"}>
              <div className="space-y-2">
                <Label htmlFor="edit_berat_panen">{config.harvestWeightLabel}</Label>
                <Input
                  id="edit_berat_panen"
                  type="number"
                  placeholder="500"
                  disabled={isSubmitting}
                  {...registerEdit("berat_panen", { valueAsNumber: true })}
                  className={editErrors.berat_panen ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {editErrors.berat_panen && (
                  <p className="text-xs text-red-500">{editErrors.berat_panen.message}</p>
                )}
              </div>

              {jenisKomoditas !== "rumput_laut" && (
                <div className="space-y-2">
                  <Label htmlFor="edit_size">Size (ekor/kg)</Label>
                  <Input
                    id="edit_size"
                    type="number"
                    placeholder="100"
                    disabled={isSubmitting}
                    {...registerEdit("size", { valueAsNumber: true })}
                    className={editErrors.size ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {editErrors.size && (
                    <p className="text-xs text-red-500">{editErrors.size.message}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_harga_jual">{config.harvestPriceLabel}</Label>
              <Input
                id="edit_harga_jual"
                type="number"
                placeholder="85000"
                disabled={isSubmitting}
                {...registerEdit("harga_jual", { valueAsNumber: true })}
                className={editErrors.harga_jual ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {editErrors.harga_jual && (
                <p className="text-xs text-red-500">{editErrors.harga_jual.message}</p>
              )}
            </div>

            {/* Realtime Automatic Indicators Box */}
            <div className="space-y-2 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
              {jenisKomoditas !== "rumput_laut" && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Estimasi Jumlah Udang Panen:</span>
                    <span className="font-black text-slate-900 font-mono">
                      {editJumlahUdangPanen > 0 ? `${formatNumber(editJumlahUdangPanen)} ekor` : "0 ekor"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Survival Rate (SR):</span>
                    <span className={`font-black font-mono px-2 py-0.5 rounded-md text-xs ${editSR >= 70 ? "bg-emerald-100 text-emerald-800" : editSR > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                      {totalBenurTebar > 0 
                        ? `${editSR.toFixed(2).replace('.', ',')}%`
                        : editJumlahUdangPanen > 0 
                        ? "Belum ada benur tebar"
                        : "0%"
                      }
                    </span>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-blue-100/80">
                <span className="font-bold text-blue-900">Estimasi Pendapatan:</span>
                <span className="font-black text-blue-700 text-sm font-mono">
                  {formatIDR(previewRevenueEdit)}
                </span>
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
        title="Hapus Catatan Panen?"
        description={`Apakah Anda yakin ingin menghapus catatan panen tanggal ${selectedLog ? formatDate(selectedLog.tanggal) : ""} ini?`}
        isLoading={isSubmitting}
      />
    </div>
  );
}
