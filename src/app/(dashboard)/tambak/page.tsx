"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  ExternalLink,
  Loader2, 
  Building2, 
  ChevronLeft, 
  ChevronRight,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatNumber } from "@/lib/utils";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import TambakForm from "@/components/tambak/tambak-form";
import type { TambakInput } from "@/validators/tambak";

interface TambakItem {
  tambak_id: string;
  user_id: string;
  nama_tambak: string;
  lokasi: string;
  luas_tambak: number;
  keterangan: string;
}

export default function TambakPage() {
  const [tambaks, setTambaks] = useState<TambakItem[]>([]);
  const [filteredTambaks, setFilteredTambaks] = useState<TambakItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [sizeFilter, setSizeFilter] = useState("all"); // all, small (< 1000m²), medium (1000m² - 5000m²), large (> 5000m²)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTambak, setSelectedTambak] = useState<TambakItem | null>(null);

  useEffect(() => {
    fetchTambaks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tambaks, searchQuery, sizeFilter]);

  const fetchTambaks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tambak");
      if (!res.ok) throw new Error("Gagal mengambil data tambak");
      const json = await res.json();
      setTambaks(json.data || []);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...tambaks];

    // Filter pencarian
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.nama_tambak.toLowerCase().includes(query) ||
          t.lokasi.toLowerCase().includes(query) ||
          (t.keterangan && t.keterangan.toLowerCase().includes(query))
      );
    }

    // Filter ukuran luas
    if (sizeFilter !== "all") {
      result = result.filter((t) => {
        const luas = Number(t.luas_tambak);
        if (sizeFilter === "small") return luas < 1000;
        if (sizeFilter === "medium") return luas >= 1000 && luas <= 5000;
        if (sizeFilter === "large") return luas > 5000;
        return true;
      });
    }

    setFilteredTambaks(result);
    setCurrentPage(1); // Reset ke halaman pertama saat filter berubah
  };

  // Pagination helper
  const totalPages = Math.ceil(filteredTambaks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTambaks = filteredTambaks.slice(startIndex, startIndex + itemsPerPage);

  // Aksi CRUD
  const handleAddSubmit = async (data: TambakInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tambak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal membuat tambak");

      toast.success("Tambak baru berhasil ditambahkan!");
      setIsAddOpen(false);
      fetchTambaks();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan tambak");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (data: TambakInput) => {
    if (!selectedTambak) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tambak/${selectedTambak.tambak_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal memperbarui tambak");

      toast.success("Data tambak berhasil diperbarui!");
      setIsEditOpen(false);
      setSelectedTambak(null);
      fetchTambaks();
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui tambak");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTambak) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tambak/${selectedTambak.tambak_id}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menghapus tambak");

      toast.success("Tambak berhasil dihapus!");
      setIsDeleteOpen(false);
      setSelectedTambak(null);
      fetchTambaks();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus tambak");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (tambak: TambakItem) => {
    setSelectedTambak(tambak);
    setIsEditOpen(true);
  };

  const openDeleteDialog = (tambak: TambakItem) => {
    setSelectedTambak(tambak);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 text-slate-900 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Daftar Kolam Tambak</h3>
              <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                Kelola nama, lokasi, dan luas (m²) seluruh kolam tambak yang Anda kelola.
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 font-bold text-xs sm:text-sm rounded-xl h-11 px-5 text-white shrink-0 w-full sm:w-auto"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Tambah Kolam Baru
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-2 border-slate-100 shadow-2xs rounded-3xl">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Cari nama kolam tambak, lokasi, atau catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 rounded-2xl border-slate-200 h-11 focus-visible:ring-blue-600 font-medium text-slate-800"
            />
          </div>
          {/* Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-500 shrink-0" />
            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Ukuran Kolam</option>
              <option value="small">Kolam Kecil (&lt; 1.000 m²)</option>
              <option value="medium">Kolam Sedang (1.000 - 5.000 m²)</option>
              <option value="large">Kolam Besar (&gt; 5.000 m²)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-slate-100 shadow-2xs rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-xs text-slate-500 font-bold">Memuat daftar kolam tambak Anda...</p>
            </div>
          </div>
        ) : paginatedTambaks.length > 0 ? (
          <div className="p-4 sm:p-6 flex flex-col gap-4">
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <Table>
                <TableHeader className="bg-slate-100/70">
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="font-extrabold text-slate-900 text-xs uppercase">Nama Kolam</TableHead>
                    <TableHead className="w-[180px] text-center font-extrabold text-slate-900 text-xs uppercase">Lokasi Kolam</TableHead>
                    <TableHead className="w-[160px] text-center font-extrabold text-slate-900 text-xs uppercase">Luas (m²)</TableHead>
                    <TableHead className="w-[180px] text-center font-extrabold text-slate-900 text-xs uppercase">Status Budidaya</TableHead>
                    <TableHead className="w-[220px] text-center font-extrabold text-slate-900 text-xs uppercase">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTambaks.map((tambak) => {
                    const hasActiveCycle = tambak.siklus && tambak.siklus.some((s) => s.status === "aktif");
                    return (
                      <TableRow key={tambak.tambak_id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <TableCell className="font-bold text-slate-900 text-xs">
                          {tambak.nama_tambak}
                        </TableCell>
                        <TableCell className="text-center text-slate-600 text-xs font-normal">
                          {tambak.lokasi || "-"}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-800 text-xs">
                          {formatNumber(tambak.luas_tambak || (tambak as any).luas_m2 || 0)} m²
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold border ${
                              hasActiveCycle
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {hasActiveCycle ? "Aktif Budidaya" : "Istirahat"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link href={`/siklus`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl px-3"
                              >
                                <ExternalLink className="mr-1 h-3.5 w-3.5 text-blue-600" /> Siklus
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(tambak)}
                              className="h-9 border-amber-200 text-amber-800 hover:bg-amber-50 font-bold text-xs rounded-xl px-3"
                            >
                              <Edit className="mr-1 h-3.5 w-3.5 text-amber-600" /> Ubah
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(tambak)}
                              className="h-9 border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs rounded-xl px-3"
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5 text-red-500" /> Hapus
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 pt-2">
                <div className="text-xs text-slate-500 font-medium">
                  Menampilkan{" "}
                  <span className="font-bold">{startIndex + 1}</span> sampai{" "}
                  <span className="font-bold">
                    {Math.min(startIndex + itemsPerPage, filteredTambaks.length)}
                  </span>{" "}
                  dari <span className="font-bold">{filteredTambaks.length}</span> tambak
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
              <Building2 className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Belum Ada Tambak</h3>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-6">
              {searchQuery || sizeFilter !== "all" 
                ? "Tidak ada hasil tambak yang cocok dengan kriteria pencarian atau filter Anda."
                : "Anda belum mencatat data tambak budidaya. Silakan tambahkan tambak pertama Anda untuk memulai pencatatan siklus."}
            </p>
            {!(searchQuery || sizeFilter !== "all") && (
              <Button 
                onClick={() => setIsAddOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 font-semibold rounded-xl shadow-sm"
              >
                <Plus className="mr-2 h-4 w-4" /> Tambah Tambak Pertama
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* dialogs */}
      
      {/* 1. Add dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-100 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Tambah Tambak Baru</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Isi data kolam tambak baru Anda. Pastikan nama kolam unik dan jelas.
            </DialogDescription>
          </DialogHeader>
          <TambakForm
            onSubmit={handleAddSubmit}
            isLoading={isSubmitting}
            onCancel={() => setIsAddOpen(false)}
            submitLabel="Tambahkan"
          />
        </DialogContent>
      </Dialog>

      {/* 2. Edit dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-100 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Ubah Data Tambak</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Perbarui rincian informasi tambak Anda di bawah ini.
            </DialogDescription>
          </DialogHeader>
          {selectedTambak && (
            <TambakForm
              initialValues={{
                nama_tambak: selectedTambak.nama_tambak,
                lokasi: selectedTambak.lokasi,
                luas_tambak: selectedTambak.luas_tambak,
                keterangan: selectedTambak.keterangan,
              }}
              onSubmit={handleEditSubmit}
              isLoading={isSubmitting}
              onCancel={() => {
                setIsEditOpen(false);
                setSelectedTambak(null);
              }}
              submitLabel="Perbarui"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 3. Delete confirm dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedTambak(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Hapus Tambak?"
        description={`Apakah Anda yakin ingin menghapus tambak "${selectedTambak?.nama_tambak}"? Seluruh data riwayat siklus, biaya operasional, sampling, dan panen yang terkait dengan tambak ini akan ikut terhapus secara permanen.`}
        isLoading={isSubmitting}
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />
    </div>
  );
}
