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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatIDR, formatNumber, formatDate } from "@/lib/utils";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import { operasionalSchema, type OperasionalInput } from "@/validators/budidaya";

interface OperasionalItem {
  operasional_id: string;
  siklus_id: string;
  user_id: string;
  tanggal: string;
  kategori: string;
  nominal: number;
  keterangan: string;
}

interface CycleOperasionalProps {
  siklusId: string;
  isCycleActive: boolean;
}



export default function CycleOperasional({ siklusId, isCycleActive }: CycleOperasionalProps) {
  const [logs, setLogs] = useState<OperasionalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<OperasionalItem | null>(null);

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
  }, [siklusId]);

  const fetchOperasionalLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/operasional?siklusId=${siklusId}`);
      if (!res.ok) throw new Error("Gagal mengambil data operasional");
      const json = await res.json();
      setLogs(json.data || []);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat log operasional");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total costs
  const totalCost = logs.reduce((sum, item) => sum + Number(item.nominal || 0), 0);

  const onAddSubmit = async (data: OperasionalInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/operasional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siklusId, ...data }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal mencatat pengeluaran");

      toast.success("Biaya operasional berhasil dicatat!");
      setIsAddOpen(false);
      resetAdd();
      fetchOperasionalLogs();
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
      const res = await fetch(`/api/operasional/${selectedLog.operasional_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal memperbarui data");

      toast.success("Data operasional berhasil diperbarui!");
      setIsEditOpen(false);
      setSelectedLog(null);
      fetchOperasionalLogs();
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
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (log: OperasionalItem) => {
    setSelectedLog(log);
    resetEdit({
      tanggal: log.tanggal,
      kategori: log.kategori as any,
      nominal: log.nominal,
      keterangan: log.keterangan,
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
            Biaya Operasional Siklus
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Catatan pengeluaran operasional (pakan, obat, listrik, bahan bakar, dll.) untuk kolam ini.
          </p>
        </div>
        {isCycleActive && (
          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 font-semibold rounded-xl shadow-sm self-start sm:self-auto"
          >
            <Plus className="mr-2 h-4 w-4" /> Tambah Pengeluaran
          </Button>
        )}
      </div>

      {/* Rangkuman total biaya operasional */}
      <Card className="border-blue-100 bg-blue-50/20 shadow-none">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm shrink-0">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Biaya Operasional</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{formatIDR(totalCost)}</p>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            *Biaya gabungan seluruh pengeluaran operasional di luar benur.
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="border-slate-100 shadow-sm">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-xs text-slate-500 font-semibold">Memuat riwayat pengeluaran...</p>
            </div>
          </div>
        ) : logs.length > 0 ? (
          <div className="p-4 sm:p-6">
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-b border-slate-100">
                    <TableHead className="w-[140px] text-center font-bold text-slate-700">Tanggal</TableHead>
                    <TableHead className="w-[160px] text-center font-bold text-slate-700">Kategori</TableHead>
                    <TableHead className="w-[150px] text-center font-bold text-slate-700">Nominal</TableHead>
                    <TableHead className="font-bold text-slate-700 pl-4">Keterangan</TableHead>
                    {isCycleActive && <TableHead className="w-[120px] text-center font-bold text-slate-700">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.operasional_id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <TableCell className="text-center font-medium text-slate-600">{formatDate(log.tanggal)}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 border border-slate-150/10">
                          {log.kategori}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-900">{formatIDR(log.nominal)}</TableCell>
                      <TableCell className="text-slate-500 text-xs max-w-[250px] truncate pl-4">
                        {log.keterangan || "-"}
                      </TableCell>
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
              <Calculator className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-0.5">Belum Ada Biaya Operasional</h4>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-4">
              Pengeluaran operasional (seperti pakan, solar, probiotik) belum dicatat untuk siklus kolam ini.
            </p>
            {isCycleActive && (
              <Button
                onClick={() => setIsAddOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 font-semibold rounded-xl shadow-sm text-xs h-9"
              >
                <Plus className="mr-2 h-3.5 w-3.5" /> Tambah Pengeluaran
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
            <DialogTitle className="text-lg font-bold text-slate-900">Catat Pengeluaran Baru</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Isi data pengeluaran operasional untuk siklus budidaya kolam.
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
              <Label htmlFor="kategori">Nama/Kategori Pengeluaran</Label>
              <Input
                id="kategori"
                disabled={isSubmitting}
                placeholder="Misal: Pakan, Solar, Listrik, Upah, dll"
                {...registerAdd("kategori")}
                className={addErrors.kategori ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {addErrors.kategori && (
                <p className="text-xs text-red-500">{addErrors.kategori.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nominal">Nominal Pengeluaran (Rp)</Label>
              <Input
                id="nominal"
                type="number"
                placeholder="250000"
                disabled={isSubmitting}
                {...registerAdd("nominal", { valueAsNumber: true })}
                className={addErrors.nominal ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {addErrors.nominal && (
                <p className="text-xs text-red-500">{addErrors.nominal.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan / Catatan</Label>
              <Input
                id="keterangan"
                placeholder="Membeli 5 karung pakan pertumbuhan"
                disabled={isSubmitting}
                {...registerAdd("keterangan")}
                className={addErrors.keterangan ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {addErrors.keterangan && (
                <p className="text-xs text-red-500">{addErrors.keterangan.message}</p>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4 sm:justify-end">
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
              Perbarui rincian catatan biaya operasional Anda.
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
              <Label htmlFor="edit_kategori">Nama/Kategori Pengeluaran</Label>
              <Input
                id="edit_kategori"
                disabled={isSubmitting}
                placeholder="Misal: Pakan, Solar, Listrik, Upah, dll"
                {...registerEdit("kategori")}
                className={editErrors.kategori ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {editErrors.kategori && (
                <p className="text-xs text-red-500">{editErrors.kategori.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_nominal">Nominal Pengeluaran (Rp)</Label>
              <Input
                id="edit_nominal"
                type="number"
                placeholder="250000"
                disabled={isSubmitting}
                {...registerEdit("nominal", { valueAsNumber: true })}
                className={editErrors.nominal ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {editErrors.nominal && (
                <p className="text-xs text-red-500">{editErrors.nominal.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_keterangan">Keterangan / Catatan</Label>
              <Input
                id="edit_keterangan"
                placeholder="Membeli pakan udang"
                disabled={isSubmitting}
                {...registerEdit("keterangan")}
                className={editErrors.keterangan ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {editErrors.keterangan && (
                <p className="text-xs text-red-500">{editErrors.keterangan.message}</p>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4 sm:justify-end">
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
        title="Hapus Catatan Biaya?"
        description={`Apakah Anda yakin ingin menghapus catatan pengeluaran "${selectedLog?.kategori}" sebesar ${formatIDR(selectedLog?.nominal || 0)} ini? Nominal ini akan dikurangi dari total biaya operasional siklus.`}
        isLoading={isSubmitting}
      />
    </div>
  );
}
