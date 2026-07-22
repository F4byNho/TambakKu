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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatIDR, formatNumber, formatDate } from "@/lib/utils";
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
}

interface CyclePanenProps {
  siklusId: string;
  isCycleActive: boolean;
  komoditasId: string;
  jenisKomoditas: string;
}

export default function CyclePanen({ siklusId, isCycleActive, komoditasId, jenisKomoditas }: CyclePanenProps) {
  const [logs, setLogs] = useState<PanenItem[]>([]);
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
      tanggal: new Date().toISOString().split("T")[0],
      berat_panen: "" as any,
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

  // Watch values for real-time calculations preview
  const addQty = useWatch({ control: controlAdd, name: "berat_panen" }) || 0;
  const addPrice = useWatch({ control: controlAdd, name: "harga_jual" }) || 0;
  const previewRevenueAdd = Number(addQty) * Number(addPrice);

  const editQty = useWatch({ control: controlEdit, name: "berat_panen" }) || 0;
  const editPrice = useWatch({ control: controlEdit, name: "harga_jual" }) || 0;
  const previewRevenueEdit = Number(editQty) * Number(editPrice);

  useEffect(() => {
    fetchPanenLogs();
  }, [siklusId, komoditasId]);

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
    try {
      const res = await fetch("/api/panen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siklusId, ...data, komoditas_id: komoditasId }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal mencatat panen");

      toast.success("Catatan hasil panen berhasil disimpan!");
      setIsAddOpen(false);
      resetAdd({
        tanggal: new Date().toISOString().split("T")[0],
        berat_panen: "" as any,
        harga_jual: "" as any,
        komoditas_id: komoditasId,
      });
      fetchPanenLogs();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEditSubmit = async (data: PanenInput) => {
    if (!selectedLog) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/panen/${selectedLog.panen_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, komoditas_id: komoditasId }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal memperbarui data");

      toast.success("Data hasil panen berhasil diperbarui!");
      setIsEditOpen(false);
      setSelectedLog(null);
      fetchPanenLogs();
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
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (log: PanenItem) => {
    setSelectedLog(log);
    resetEdit({
      tanggal: log.tanggal,
      berat_panen: log.berat_panen,
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
            className="bg-blue-600 hover:bg-blue-700 font-semibold rounded-xl shadow-sm self-start sm:self-auto"
          >
            <Plus className="mr-2 h-4 w-4" /> Catat Hasil Panen
          </Button>
        )}
      </div>

      {/* Rangkuman total panen */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-blue-100 bg-blue-50/20 shadow-none">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Hasil Panen</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{formatNumber(totalWeight)} kg</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-100 bg-green-50/20 shadow-none">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-600 shadow-sm shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pendapatan Panen</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{formatIDR(totalRevenue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="border-slate-100 shadow-sm">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-xs text-slate-500 font-semibold">Memuat riwayat panen...</p>
            </div>
          </div>
        ) : logs.length > 0 ? (
          <div className="p-4 sm:p-6">
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-b border-slate-100">
                    <TableHead className="w-[140px] text-center font-bold text-slate-700">Tanggal Panen</TableHead>
                    <TableHead className="w-[160px] text-center font-bold text-slate-700">{config.harvestWeightLabel}</TableHead>
                    <TableHead className="w-[160px] text-center font-bold text-slate-700">{config.harvestPriceLabel}</TableHead>
                    <TableHead className="w-[180px] text-center font-bold text-slate-700">Total Pendapatan</TableHead>
                    {isCycleActive && <TableHead className="w-[120px] text-center font-bold text-slate-700">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.panen_id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <TableCell className="text-center font-medium text-slate-600">{formatDate((log as any).tanggal_panen || log.tanggal)}</TableCell>
                      <TableCell className="text-center font-semibold text-slate-800">{formatNumber(log.berat_panen)} kg</TableCell>
                      <TableCell className="text-center font-medium text-slate-500">{formatIDR(log.harga_jual)} / kg</TableCell>
                      <TableCell className="text-center font-bold text-green-600">{formatIDR(log.pendapatan)}</TableCell>
                      {isCycleActive && (
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(log)}
                              className="h-8.5 w-8.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(log)}
                              className="h-8.5 w-8.5 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3 shadow-inner">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-0.5">Belum Ada Catatan Panen</h4>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-4">
              Pencatatan hasil panen {config.name.toLowerCase()} belum dilakukan. Silakan catat panen yang telah dicapai.
            </p>
            {isCycleActive && (
              <Button
                onClick={() => setIsAddOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 font-semibold rounded-xl shadow-sm text-xs h-9"
              >
                <Plus className="mr-2 h-3.5 w-3.5" /> Catat Hasil Panen
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* dialogs */}

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

            <div className="grid grid-cols-2 gap-3">
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
            </div>

            {/* Live Preview Card */}
            <div className="rounded-xl border border-blue-50 bg-blue-50/30 p-3.5 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-blue-800 font-bold">
                <AlertCircle className="h-4.5 w-4.5" />
                Estimasi Pendapatan:
              </div>
              <div className="text-blue-900 font-black text-base">
                {formatIDR(previewRevenueAdd)}
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

            <div className="grid grid-cols-2 gap-3">
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
            </div>

            {/* Live Preview Card */}
            <div className="rounded-xl border border-blue-50 bg-blue-50/30 p-3.5 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-blue-800 font-bold">
                <AlertCircle className="h-4.5 w-4.5" />
                Estimasi Pendapatan:
              </div>
              <div className="text-blue-900 font-black text-base">
                {formatIDR(previewRevenueEdit)}
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
