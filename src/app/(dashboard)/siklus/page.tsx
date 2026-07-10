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
  AlertTriangle
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
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Siklus Budidaya
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola siklus penebaran, operasional harian, dan sampling udang per kolam.
          </p>
        </div>
        {tambaks.length > 0 && (
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 font-semibold shadow-sm rounded-xl self-start sm:self-auto"
          >
            <Plus className="mr-2 h-4 w-4" /> Mulai Siklus Baru
          </Button>
        )}
      </div>

      {/* Warning if no Tambak exists */}
      {tambaks.length === 0 && !isLoading && (
        <Card className="border-yellow-200 bg-yellow-50/50 shadow-none">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-yellow-800">Tambak Belum Terdaftar</h4>
              <p className="text-xs text-yellow-700 mt-1 leading-relaxed">
                Anda harus mendaftarkan sekurang-kurangnya satu tambak/kolam sebelum dapat memulai siklus budidaya baru.
              </p>
              <Link href="/tambak" className="inline-block mt-3">
                <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold text-xs h-8">
                  Daftar Tambak Baru
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter & Search Bar */}
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <Input
              placeholder="Cari berdasarkan nama kolam atau urutan nomor siklus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-slate-150 focus-visible:ring-blue-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Tambak */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-4.5 w-4.5 text-slate-400 shrink-0" />
              <select
                value={selectedTambakId}
                onChange={(e) => setSelectedTambakId(e.target.value)}
                className="h-10 rounded-xl border border-slate-150 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
              className="h-10 rounded-xl border border-slate-150 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Main Table Content */}
      <Card className="border-slate-100 shadow-sm">
        {isLoading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              <p className="text-xs text-slate-500 font-semibold">Memuat data siklus...</p>
            </div>
          </div>
        ) : paginatedCycles.length > 0 ? (
          <div className="p-4 sm:p-6 flex flex-col gap-4">
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-b border-slate-100">
                    <TableHead className="font-bold text-slate-700">Kolam Tambak</TableHead>
                    <TableHead className="w-[90px] text-center font-bold text-slate-700">Siklus</TableHead>
                    <TableHead className="w-[120px] text-center font-bold text-slate-700">Mulai</TableHead>
                    <TableHead className="w-[120px] text-center font-bold text-slate-700">Selesai</TableHead>
                    <TableHead className="w-[100px] text-center font-bold text-slate-700">Status</TableHead>
                    <TableHead className="w-[260px] text-center font-bold text-slate-700">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCycles.map((cycle) => (
                    <TableRow key={cycle.siklus_id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <TableCell className="font-bold text-slate-900">{getTambakName(cycle.tambak_id)}</TableCell>
                      <TableCell className="text-center font-semibold text-slate-800">Siklus #{cycle.nomor_siklus}</TableCell>
                      <TableCell className="text-center font-medium text-slate-600">{formatDate(cycle.tanggal_mulai)}</TableCell>
                      <TableCell className="text-center font-medium text-slate-600">
                        {formatDate(cycle.tanggal_selesai)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          cycle.status === "aktif" 
                            ? "bg-green-50 text-green-700" 
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cycle.status === "aktif" ? "bg-green-500" : "bg-slate-400"}`} />
                          {cycle.status === "aktif" ? "Aktif" : "Selesai"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link href={`/siklus/${cycle.siklus_id}`}>
                            <Button variant="outline" size="sm" className="h-8.5 rounded-xl border-slate-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold text-xs gap-1.5">
                              <Eye className="h-3.5 w-3.5" /> Detail & Catat
                            </Button>
                          </Link>
                          {cycle.status === "aktif" && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openEndDialog(cycle)}
                              className="h-8.5 rounded-xl border-slate-200 text-green-600 hover:text-green-700 hover:bg-green-50 font-bold text-xs gap-1.5"
                            >
                              <CheckCircle className="h-3.5 w-3.5" /> Selesaikan
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openDeleteDialog(cycle)}
                            className="h-8.5 w-8.5 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
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
