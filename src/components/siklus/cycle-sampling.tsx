"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  Scale,
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
import { formatNumber, formatDate } from "@/lib/utils";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import { samplingSchema, type SamplingInput } from "@/validators/budidaya";
import { getCommodityConfig } from "@/lib/commodity-config";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface SamplingItem {
  sampling_id: string;
  siklus_id: string;
  user_id: string;
  tanggal: string;
  jumlah_udang: number;
  berat_total: number;
  abw: number;
  size: number;
}

interface CycleSamplingProps {
  siklusId: string;
  isCycleActive: boolean;
  komoditasId: string;
  jenisKomoditas: string;
}

export default function CycleSampling({ siklusId, isCycleActive, komoditasId, jenisKomoditas }: CycleSamplingProps) {
  const [logs, setLogs] = useState<SamplingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SamplingItem | null>(null);

  // Dialog controllers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Active chart toggle: "abw" or "size"
  const [activeChart, setActiveChart] = useState<"abw" | "size">("abw");

  const config = getCommodityConfig(jenisKomoditas);

  // Forms
  const {
    register: registerAdd,
    handleSubmit: handleAddSubmit,
    reset: resetAdd,
    control: controlAdd,
    formState: { errors: addErrors },
  } = useForm<SamplingInput>({
    resolver: zodResolver(samplingSchema) as any,
    defaultValues: {
      tanggal: new Date().toISOString().split("T")[0],
      jumlah_udang: jenisKomoditas === "rumput_laut" ? 0 : ("" as any),
      berat_total: "" as any,
      abw: jenisKomoditas === "rumput_laut" ? ("" as any) : 0,
      komoditas_id: komoditasId,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    control: controlEdit,
    formState: { errors: editErrors },
  } = useForm<SamplingInput>({
    resolver: zodResolver(samplingSchema) as any,
  });

  // Watch values for real-time calculations preview
  const addQty = useWatch({ control: controlAdd, name: "jumlah_udang" }) || 0;
  const addWeight = useWatch({ control: controlAdd, name: "berat_total" }) || 0;
  const addAbw = useWatch({ control: controlAdd, name: "abw" }) || 0;
  
  const computedABWAdd = jenisKomoditas === "rumput_laut" ? Number(addAbw) : (Number(addQty) > 0 ? (Number(addWeight) / Number(addQty)) : 0);
  const computedSizeAdd = config.showSizeField && computedABWAdd > 0 ? Math.round(1000 / computedABWAdd) : 0;

  const editQty = useWatch({ control: controlEdit, name: "jumlah_udang" }) || 0;
  const editWeight = useWatch({ control: controlEdit, name: "berat_total" }) || 0;
  const editAbw = useWatch({ control: controlEdit, name: "abw" }) || 0;
  
  const computedABWEdit = jenisKomoditas === "rumput_laut" ? Number(editAbw) : (Number(editQty) > 0 ? (Number(editWeight) / Number(editQty)) : 0);
  const computedSizeEdit = config.showSizeField && computedABWEdit > 0 ? Math.round(1000 / computedABWEdit) : 0;

  useEffect(() => {
    fetchSamplingLogs();
  }, [siklusId, komoditasId]);

  const fetchSamplingLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sampling?siklusId=${siklusId}&komoditasId=${komoditasId}`);
      if (!res.ok) throw new Error("Gagal mengambil data monitoring");
      const json = await res.json();
      setLogs(json.data || []);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat log");
    } finally {
      setIsLoading(false);
    }
  };

  // Sort logs chronologically for the chart data
  const chartData = [...logs]
    .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
    .map((log) => ({
      tanggal: log.tanggal,
      ABW: log.abw,
      Size: log.size,
    }));

  const onAddSubmit = async (data: SamplingInput) => {
    setIsSubmitting(true);
    try {
      const finalPayload = {
        ...data,
        abw: computedABWAdd,
        size: computedSizeAdd,
        komoditas_id: komoditasId
      };
      
      const res = await fetch("/api/sampling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siklusId, ...finalPayload }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan data");

      toast.success("Data monitoring berhasil disimpan!");
      setIsAddOpen(false);
      resetAdd({
        tanggal: new Date().toISOString().split("T")[0],
        jumlah_udang: jenisKomoditas === "rumput_laut" ? 0 : ("" as any),
        berat_total: "" as any,
        abw: jenisKomoditas === "rumput_laut" ? ("" as any) : 0,
        komoditas_id: komoditasId,
      });
      fetchSamplingLogs();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEditSubmit = async (data: SamplingInput) => {
    if (!selectedLog) return;
    setIsSubmitting(true);
    try {
      const finalPayload = {
        ...data,
        abw: computedABWEdit,
        size: computedSizeEdit,
        komoditas_id: komoditasId
      };
      
      const res = await fetch(`/api/sampling/${selectedLog.sampling_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal memperbarui data");

      toast.success("Data monitoring berhasil diperbarui!");
      setIsEditOpen(false);
      setSelectedLog(null);
      fetchSamplingLogs();
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
      const res = await fetch(`/api/sampling/${selectedLog.sampling_id}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menghapus data");

      toast.success("Catatan monitoring berhasil dihapus!");
      setIsDeleteOpen(false);
      setSelectedLog(null);
      fetchSamplingLogs();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (log: SamplingItem) => {
    setSelectedLog(log);
    resetEdit({
      tanggal: log.tanggal,
      jumlah_udang: log.jumlah_udang,
      berat_total: log.berat_total,
      abw: log.abw,
      komoditas_id: komoditasId,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (log: SamplingItem) => {
    setSelectedLog(log);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {config.growthLabel}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau pertumbuhan {config.name.toLowerCase()} secara periodik untuk mencatat indikator biomasa.
          </p>
        </div>
        {isCycleActive && (
          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 font-semibold rounded-xl shadow-sm self-start sm:self-auto"
          >
            <Plus className="mr-2 h-4 w-4" /> Catat Pertumbuhan
          </Button>
        )}
      </div>

      {/* Chart Section */}
      {logs.length >= 2 && (
        <Card className="border-slate-100 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Grafik Tren Pertumbuhan</CardTitle>
              <CardDescription className="text-xs text-slate-400">Visualisasi perkembangan berat rata-rata {config.name.toLowerCase()}.</CardDescription>
            </div>
            {config.showSizeField && (
              <div className="flex bg-slate-100 p-0.75 rounded-lg border border-slate-150">
                <Button
                  variant={activeChart === "abw" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveChart("abw")}
                  className={`h-7.5 text-xs font-bold rounded-md px-3 ${activeChart === "abw" ? "bg-white shadow-sm text-blue-600" : "text-slate-500"}`}
                >
                  ABW (g)
                </Button>
                <Button
                  variant={activeChart === "size" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveChart("size")}
                  className={`h-7.5 text-xs font-bold rounded-md px-3 ${activeChart === "size" ? "bg-white shadow-sm text-green-600" : "text-slate-500"}`}
                >
                  Size
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="h-64 sm:h-80 pl-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="tanggal" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight={600} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight={600} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", fontSize: "11px" }}
                  labelStyle={{ fontWeight: "bold" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                {activeChart === "abw" || !config.showSizeField ? (
                  <Line
                    type="monotone"
                    dataKey="ABW"
                    name={config.abwLabel}
                    stroke="#2563eb"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                    dot={{ strokeWidth: 2, r: 4 }}
                  />
                ) : (
                  <Line
                    type="monotone"
                    dataKey="Size"
                    name="Size (ekor/kg)"
                    stroke="#16a34a"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                    dot={{ strokeWidth: 2, r: 4 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Main Table */}
      <Card className="border-slate-100 shadow-sm">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-xs text-slate-500 font-semibold">Memuat riwayat...</p>
            </div>
          </div>
        ) : logs.length > 0 ? (
          <div className="p-4 sm:p-6">
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-b border-slate-100">
                    <TableHead className="w-[140px] text-center font-bold text-slate-700">Tanggal</TableHead>
                    {!config.showSizeField && jenisKomoditas === "rumput_laut" ? null : (
                      <TableHead className="w-[130px] text-center font-bold text-slate-700">{config.growthQtyLabel}</TableHead>
                    )}
                    <TableHead className="w-[130px] text-center font-bold text-slate-700">{config.growthWeightLabel}</TableHead>
                    <TableHead className="w-[200px] text-center font-bold text-slate-700">{config.abwLabel}</TableHead>
                    {config.showSizeField && (
                      <TableHead className="w-[150px] text-center font-bold text-slate-700">Size (ekor/kg)</TableHead>
                    )}
                    {isCycleActive && <TableHead className="w-[120px] text-center font-bold text-slate-700">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.sampling_id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <TableCell className="text-center font-medium text-slate-600">{formatDate((log as any).tanggal_sampling || log.tanggal)}</TableCell>
                      {!config.showSizeField && jenisKomoditas === "rumput_laut" ? null : (
                        <TableCell className="text-center font-semibold text-slate-700">{formatNumber(log.jumlah_udang)} ekor</TableCell>
                      )}
                      <TableCell className="text-center font-semibold text-slate-700">{formatNumber(log.berat_total)} gram</TableCell>
                      <TableCell className="text-center font-bold text-blue-600">{log.abw} g</TableCell>
                      {config.showSizeField && (
                        <TableCell className="text-center font-bold text-green-600">Size {log.size}</TableCell>
                      )}
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
              <Scale className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-0.5">Belum Ada Catatan Pertumbuhan</h4>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-4">
              Silakan lakukan pengukuran pertumbuhan {config.name.toLowerCase()} secara berkala untuk mencatat perkembangannya.
            </p>
            {isCycleActive && (
              <Button
                onClick={() => setIsAddOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 font-semibold rounded-xl shadow-sm text-xs h-9"
              >
                <Plus className="mr-2 h-3.5 w-3.5" /> Catat Pertumbuhan
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
            <DialogTitle className="text-lg font-bold text-slate-900">Catat {config.growthLabel}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Ukur pertumbuhan {config.name.toLowerCase()} dari jaring/rumpun monitoring Anda.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit(onAddSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal</Label>
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

            {jenisKomoditas === "rumput_laut" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="berat_total">{config.growthWeightLabel}</Label>
                  <Input
                    id="berat_total"
                    type="number"
                    placeholder="100"
                    disabled={isSubmitting}
                    {...registerAdd("berat_total", { valueAsNumber: true })}
                    className={addErrors.berat_total ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {addErrors.berat_total && (
                    <p className="text-xs text-red-500">{addErrors.berat_total.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="abw">{config.abwLabel}</Label>
                  <Input
                    id="abw"
                    type="number"
                    placeholder="45"
                    step="0.01"
                    disabled={isSubmitting}
                    {...registerAdd("abw", { valueAsNumber: true })}
                    className={addErrors.abw ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {addErrors.abw && (
                    <p className="text-xs text-red-500">{addErrors.abw.message}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="jumlah_udang">{config.growthQtyLabel} (ekor)</Label>
                  <Input
                    id="jumlah_udang"
                    type="number"
                    placeholder="100"
                    disabled={isSubmitting}
                    {...registerAdd("jumlah_udang", { valueAsNumber: true })}
                    className={addErrors.jumlah_udang ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {addErrors.jumlah_udang && (
                    <p className="text-xs text-red-500">{addErrors.jumlah_udang.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="berat_total">{config.growthWeightLabel}</Label>
                  <Input
                    id="berat_total"
                    type="number"
                    placeholder="1000"
                    disabled={isSubmitting}
                    {...registerAdd("berat_total", { valueAsNumber: true })}
                    className={addErrors.berat_total ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {addErrors.berat_total && (
                    <p className="text-xs text-red-500">{addErrors.berat_total.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Real-time Math Preview Card */}
            {jenisKomoditas !== "rumput_laut" && (
              <div className="rounded-xl border border-blue-50 bg-blue-50/30 p-3.5 space-y-1.5 text-xs text-blue-900">
                <div className="flex items-center gap-2 font-bold text-blue-800">
                  <AlertCircle className="h-4.5 w-4.5" />
                  Hasil Perhitungan Otomatis:
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-semibold">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">ABW</span>
                    <span className="text-sm font-bold text-blue-700">{computedABWAdd.toFixed(2)} g</span>
                  </div>
                  {config.showSizeField && (
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Size</span>
                      <span className="text-sm font-bold text-green-700">{computedSizeAdd ? `Size ${computedSizeAdd}` : "-"}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

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
            <DialogTitle className="text-lg font-bold text-slate-900">Ubah Data {config.growthLabel}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Perbarui catatan monitoring pertumbuhan Anda.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit_tanggal">Tanggal</Label>
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

            {jenisKomoditas === "rumput_laut" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit_berat_total">{config.growthWeightLabel}</Label>
                  <Input
                    id="edit_berat_total"
                    type="number"
                    placeholder="100"
                    disabled={isSubmitting}
                    {...registerEdit("berat_total", { valueAsNumber: true })}
                    className={editErrors.berat_total ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {editErrors.berat_total && (
                    <p className="text-xs text-red-500">{editErrors.berat_total.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_ab">{config.abwLabel}</Label>
                  <Input
                    id="edit_abw"
                    type="number"
                    placeholder="45"
                    step="0.01"
                    disabled={isSubmitting}
                    {...registerEdit("abw", { valueAsNumber: true })}
                    className={editErrors.abw ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {editErrors.abw && (
                    <p className="text-xs text-red-500">{editErrors.abw.message}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit_jumlah_udang">{config.growthQtyLabel} (ekor)</Label>
                  <Input
                    id="edit_jumlah_udang"
                    type="number"
                    placeholder="100"
                    disabled={isSubmitting}
                    {...registerEdit("jumlah_udang", { valueAsNumber: true })}
                    className={editErrors.jumlah_udang ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {editErrors.jumlah_udang && (
                    <p className="text-xs text-red-500">{editErrors.jumlah_udang.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_berat_total">{config.growthWeightLabel}</Label>
                  <Input
                    id="edit_berat_total"
                    type="number"
                    placeholder="1000"
                    disabled={isSubmitting}
                    {...registerEdit("berat_total", { valueAsNumber: true })}
                    className={editErrors.berat_total ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {editErrors.berat_total && (
                    <p className="text-xs text-red-500">{editErrors.berat_total.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Real-time Math Preview Card */}
            {jenisKomoditas !== "rumput_laut" && (
              <div className="rounded-xl border border-blue-50 bg-blue-50/30 p-3.5 space-y-1.5 text-xs text-blue-900">
                <div className="flex items-center gap-2 font-bold text-blue-800">
                  <AlertCircle className="h-4.5 w-4.5" />
                  Hasil Perhitungan Otomatis:
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-semibold">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">ABW</span>
                    <span className="text-sm font-bold text-blue-700">{computedABWEdit.toFixed(2)} g</span>
                  </div>
                  {config.showSizeField && (
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Size</span>
                      <span className="text-sm font-bold text-green-700">{computedSizeEdit ? `Size ${computedSizeEdit}` : "-"}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

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
        title="Hapus Data Monitoring?"
        description={`Apakah Anda yakin ingin menghapus catatan monitoring tanggal ${selectedLog ? formatDate(selectedLog.tanggal) : ""} ini?`}
        isLoading={isSubmitting}
      />
    </div>
  );
}
