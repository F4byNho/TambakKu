"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  Plus, 
  Search, 
  Activity, 
  Trash2, 
  Eye, 
  CheckCircle,
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  AlertTriangle,
  Timer,
  Building2
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { siklusSchema, endSiklusSchema, type SiklusInput, type EndSiklusInput } from "@/validators/siklus";
import { formatDate } from "@/lib/utils";

interface TambakItem {
  tambak_id: string;
  nama_tambak: string;
  lokasi: string;
}

interface SiklusItem {
  siklus_id: string;
  tambak_id: string;
  user_id: string;
  nomor_siklus: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: string;
}

export default function SiklusPage() {
  const searchParams = useSearchParams();
  const initialTambakId = searchParams.get("tambakId") || "all";

  const [cycles, setCycles] = useState<SiklusItem[]>([]);
  const [tambaks, setTambaks] = useState<TambakItem[]>([]);
  const [filteredCycles, setFilteredCycles] = useState<SiklusItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTambakId, setSelectedTambakId] = useState(initialTambakId);
  const [statusFilter, setStatusFilter] = useState("all"); // all, aktif, selesai

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Dialog controllers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<SiklusItem | null>(null);

  // Forms
  const {
    register: registerAdd,
    handleSubmit: handleAddSubmit,
    reset: resetAdd,
    formState: { errors: addErrors },
  } = useForm<SiklusInput>({
    resolver: zodResolver(siklusSchema) as any,
    defaultValues: {
      tambak_id: "",
      nomor_siklus: "" as any,
      tanggal_mulai: new Date().toISOString().split("T")[0],
    },
  });

  const {
    register: registerEnd,
    handleSubmit: handleEndSubmit,
    reset: resetEnd,
    formState: { errors: endErrors },
  } = useForm<EndSiklusInput>({
    resolver: zodResolver(endSiklusSchema) as any,
    defaultValues: {
      tanggal_selesai: new Date().toISOString().split("T")[0],
      status: "selesai",
    },
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cycles, searchQuery, selectedTambakId, statusFilter]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [resSiklus, resTambak] = await Promise.all([
        fetch("/api/siklus"),
        fetch("/api/tambak"),
      ]);

      const jsonSiklus = await resSiklus.json();
      const jsonTambak = await resTambak.json();

      setCycles(jsonSiklus.data || []);
      setTambaks(jsonTambak.data || []);
    } catch (err: any) {
      toast.error("Gagal mengambil data budidaya");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...cycles];

    // Filter Tambak
    if (selectedTambakId !== "all") {
      result = result.filter((c) => c.tambak_id === selectedTambakId);
    }

    // Filter Status
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Filter Search (Nomor Siklus / Nama Tambak)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter((c) => {
        const farmName = tambaks.find((t) => t.tambak_id === c.tambak_id)?.nama_tambak || "";
        return (
          farmName.toLowerCase().includes(query) ||
          c.nomor_siklus.toString().includes(query)
        );
      });
    }

    setFilteredCycles(result);
    setCurrentPage(1);
  };

  // Pagination helper
  const totalPages = Math.ceil(filteredCycles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCycles = filteredCycles.slice(startIndex, startIndex + itemsPerPage);

  const getTambakName = (id: string) => {
    return tambaks.find((t) => t.tambak_id === id)?.nama_tambak || "Kolam";
  };

  const onAddSubmit = async (data: SiklusInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/siklus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal memulai siklus");

      toast.success("Siklus budidaya berhasil dimulai!");
      setIsAddOpen(false);
      resetAdd();
      fetchInitialData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan siklus");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEndSubmit = async (data: EndSiklusInput) => {
    if (!selectedCycle) return;
    
    // Validasi tanggal selesai tidak boleh lebih kecil dari tanggal tebar/mulai
    if (new Date(data.tanggal_selesai) < new Date(selectedCycle.tanggal_mulai)) {
      toast.error("Tanggal selesai tidak boleh lebih awal dari tanggal mulai siklus!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/siklus/${selectedCycle.siklus_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal mengakhiri siklus");

      toast.success("Siklus berhasil diselesaikan!");
      setIsEndOpen(false);
      resetEnd();
      setSelectedCycle(null);
      fetchInitialData();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengakhiri siklus");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCycle) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/siklus/${selectedCycle.siklus_id}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menghapus siklus");

      toast.success("Siklus berhasil dihapus!");
      setIsDeleteOpen(false);
      setSelectedCycle(null);
      fetchInitialData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus siklus");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEndDialog = (cycle: SiklusItem) => {
    setSelectedCycle(cycle);
    setIsEndOpen(true);
  };

  const openDeleteDialog = (cycle: SiklusItem) => {
    setSelectedCycle(cycle);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 text-slate-900 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Siklus Budidaya Tambak</h3>
              <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                Kelola pencatatan bibit, penimbangan pertumbuhan, dan hasil panen di setiap siklus.
              </p>
            </div>
          </div>
          {tambaks.length > 0 && (
            <Button 
              onClick={() => setIsAddOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 font-bold text-xs sm:text-sm rounded-xl h-11 px-5 text-white shrink-0 w-full sm:w-auto"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Mulai Siklus Baru
            </Button>
          )}
        </div>
      </div>

      {/* Warning if no Tambak exists */}
      {tambaks.length === 0 && !isLoading && (
        <Card className="border border-amber-200 bg-amber-50/50 shadow-2xs rounded-2xl">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">Belum Ada Kolam Tambak Terdaftar</h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed font-normal">
                Anda perlu menambahkan sekurang-kurangnya 1 kolam tambak terlebih dahulu sebelum bisa membuat siklus baru.
              </p>
              <Link href="/tambak" className="inline-block mt-2">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs h-8 px-3">
                  Tambah Kolam Tambak
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter & Search Bar */}
      <Card className="border-2 border-slate-100 shadow-2xs rounded-3xl">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Cari nama kolam atau nomor siklus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 rounded-2xl border-slate-200 h-11 focus-visible:ring-indigo-600 font-medium text-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Tambak */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-slate-500 shrink-0" />
              <select
                value={selectedTambakId}
                onChange={(e) => setSelectedTambakId(e.target.value)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="all">Semua Kolam</option>
                {tambaks.map((t) => (
                  <option key={t.tambak_id} value={t.tambak_id}>
                    {t.nama_tambak}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="all">Semua Status</option>
              <option value="aktif">Sedang Berjalan (Aktif)</option>
              <option value="selesai">Sudah Panen (Selesai)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Main Table Content */}
      <Card className="border-2 border-slate-100 shadow-2xs rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-xs text-slate-500 font-bold">Memuat data siklus budidaya...</p>
            </div>
          </div>
        ) : paginatedCycles.length > 0 ? (
          <div className="p-4 sm:p-6 flex flex-col gap-4">
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <Table>
                <TableHeader className="bg-slate-100/70">
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="font-extrabold text-slate-900 text-xs uppercase">Kolam Tambak</TableHead>
                    <TableHead className="w-[100px] text-center font-extrabold text-slate-900 text-xs uppercase">Siklus</TableHead>
                    <TableHead className="w-[130px] text-center font-extrabold text-slate-900 text-xs uppercase">Tanggal Mulai</TableHead>
                    <TableHead className="w-[130px] text-center font-extrabold text-slate-900 text-xs uppercase">Tanggal Selesai</TableHead>
                    <TableHead className="w-[120px] text-center font-extrabold text-slate-900 text-xs uppercase">Status</TableHead>
                    <TableHead className="w-[280px] text-center font-extrabold text-slate-900 text-xs uppercase">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCycles.map((cycle) => (
                    <TableRow key={cycle.siklus_id} className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors">
                      <TableCell className="font-black text-slate-900 text-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-xs border border-blue-100">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <span>{getTambakName(cycle.tambak_id)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-800 text-xs">Siklus #{cycle.nomor_siklus}</TableCell>
                      <TableCell className="text-center font-semibold text-slate-600 text-xs">{formatDate(cycle.tanggal_mulai)}</TableCell>
                      <TableCell className="text-center font-semibold text-slate-600 text-xs">
                        {formatDate(cycle.tanggal_selesai)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold ${
                          cycle.status === "aktif" 
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                          <span className={`h-2 w-2 rounded-full ${cycle.status === "aktif" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                          {cycle.status === "aktif" ? "Sedang Berjalan" : "Sudah Panen"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/siklus/${cycle.siklus_id}`}>
                            <Button size="sm" className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 px-3 shadow-2xs">
                              <Eye className="h-4 w-4" /> Detail & Catat
                            </Button>
                          </Link>
                          {cycle.status === "aktif" && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openEndDialog(cycle)}
                              className="h-9 rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold text-xs gap-1.5 px-3"
                            >
                              <CheckCircle className="h-4 w-4 text-emerald-600" /> Panen
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openDeleteDialog(cycle)}
                            className="h-9 rounded-xl border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs gap-1.5 px-3"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" /> Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 pt-2">
                <div className="text-xs text-slate-500 font-medium">
                  Menampilkan <span className="font-bold">{startIndex + 1}</span> sampai{" "}
                  <span className="font-bold">
                    {Math.min(startIndex + itemsPerPage, filteredCycles.length)}
                  </span>{" "}
                  dari <span className="font-bold">{filteredCycles.length}</span> siklus
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-xl border-slate-150 text-slate-600 h-8 px-2.5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-bold px-2.5 text-slate-700">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded-xl border-slate-150 text-slate-600 h-8 px-2.5"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 shadow-inner">
              <Activity className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Belum Ada Siklus</h3>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-6">
              {searchQuery || selectedTambakId !== "all" || statusFilter !== "all"
                ? "Tidak ada hasil siklus yang cocok dengan filter atau pencarian Anda."
                : "Anda belum mencatat siklus budidaya apapun. Mulai siklus budidaya pertama kolam Anda untuk mencatat perkembangan benur, sampling harian, dan hasil panen."}
            </p>
            {!(searchQuery || selectedTambakId !== "all" || statusFilter !== "all") && tambaks.length > 0 && (
              <Button 
                onClick={() => setIsAddOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 font-semibold rounded-xl shadow-sm"
              >
                <Plus className="mr-2 h-4 w-4" /> Mulai Siklus Pertama
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* dialogs */}

      {/* 1. Start Cycle Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-100 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Mulai Siklus Baru</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Buat siklus budidaya baru untuk kolam tambak terdaftar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit(onAddSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="tambak_id">Pilih Kolam Tambak</Label>
              <select
                id="tambak_id"
                disabled={isSubmitting}
                {...registerAdd("tambak_id")}
                className="w-full h-10 rounded-xl border border-slate-150 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">-- Pilih Tambak --</option>
                {tambaks.map((t) => (
                  <option key={t.tambak_id} value={t.tambak_id}>
                    {t.nama_tambak} ({t.lokasi})
                  </option>
                ))}
              </select>
              {addErrors.tambak_id && (
                <p className="text-xs text-red-500">{addErrors.tambak_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomor_siklus">Nomor Siklus Ke-</Label>
              <Input
                id="nomor_siklus"
                type="number"
                placeholder="1"
                disabled={isSubmitting}
                {...registerAdd("nomor_siklus")}
                className={addErrors.nomor_siklus ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {addErrors.nomor_siklus && (
                <p className="text-xs text-red-500">{addErrors.nomor_siklus.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tanggal_mulai">Tanggal Mulai Siklus</Label>
              <Input
                id="tanggal_mulai"
                type="date"
                disabled={isSubmitting}
                {...registerAdd("tanggal_mulai")}
                className={addErrors.tanggal_mulai ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {addErrors.tanggal_mulai && (
                <p className="text-xs text-red-500">{addErrors.tanggal_mulai.message}</p>
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
                    Memproses...
                  </>
                ) : (
                  "Mulai Siklus"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. End Cycle Dialog */}
      <Dialog open={isEndOpen} onOpenChange={setIsEndOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-100 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Selesaikan Siklus Budidaya</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Ubah status siklus ini menjadi Selesai. Masukkan tanggal panen/penyelesaian di bawah.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEndSubmit(onEndSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Kolam Tambak</Label>
              <Input
                value={selectedCycle ? `${getTambakName(selectedCycle.tambak_id)} - Siklus #${selectedCycle.nomor_siklus}` : ""}
                disabled={true}
                className="bg-slate-50 font-bold border-slate-150"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tanggal Mulai (Tebar)</Label>
              <Input
                value={selectedCycle?.tanggal_mulai || ""}
                disabled={true}
                className="bg-slate-50 font-medium border-slate-150"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tanggal_selesai">Tanggal Selesai (Panen)</Label>
              <Input
                id="tanggal_selesai"
                type="date"
                disabled={isSubmitting}
                {...registerEnd("tanggal_selesai")}
                className={endErrors.tanggal_selesai ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {endErrors.tanggal_selesai && (
                <p className="text-xs text-red-500">{endErrors.tanggal_selesai.message}</p>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEndOpen(false)}
                disabled={isSubmitting}
                className="rounded-xl font-semibold border-slate-150 text-slate-600 w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl font-semibold bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Selesaikan Siklus"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Delete confirm dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedCycle(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Hapus Siklus Budidaya?"
        description={`Apakah Anda yakin ingin menghapus "${getTambakName(selectedCycle?.tambak_id || "")} - Siklus #${selectedCycle?.nomor_siklus}"? Seluruh data penebaran benur, operasional harian, sampling, dan hasil panen untuk siklus ini akan dihapus secara permanen.`}
        isLoading={isSubmitting}
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />
    </div>
  );
}
