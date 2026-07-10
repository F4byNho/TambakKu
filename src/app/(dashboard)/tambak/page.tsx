"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
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
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Daftar Tambak
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola seluruh kolam tambak udang milik Anda di sini.
          </p>
        </div>
        <Button 
          onClick={() => setIsAddOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 font-semibold shadow-sm rounded-xl self-start sm:self-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah Tambak
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <Input
              placeholder="Cari berdasarkan nama tambak, lokasi, keterangan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-slate-150 focus-visible:ring-blue-600"
            />
          </div>
          {/* Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="h-4.5 w-4.5 text-slate-400 shrink-0" />
            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-150 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Ukuran</option>
              <option value="small">Kecil (&lt; 1.000 m²)</option>
              <option value="medium">Sedang (1.000 - 5.000 m²)</option>
              <option value="large">Besar (&gt; 5.000 m²)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-100 shadow-sm">
        {isLoading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              <p className="text-xs text-slate-500 font-semibold">Memuat data tambak...</p>
            </div>
          </div>
        ) : paginatedTambaks.length > 0 ? (
          <div className="p-4 sm:p-6 flex flex-col gap-4">
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-b border-slate-100">
                    <TableHead className="font-bold text-slate-700">Nama Tambak</TableHead>
                    <TableHead className="w-[180px] text-center font-bold text-slate-700">Lokasi</TableHead>
                    <TableHead className="w-[140px] text-center font-bold text-slate-700">Luas Kolam</TableHead>
                    <TableHead className="w-[180px] text-center font-bold text-slate-700">Keterangan</TableHead>
                    <TableHead className="w-[180px] text-center font-bold text-slate-700">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTambaks.map((tambak) => (
                    <TableRow key={tambak.tambak_id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <TableCell className="font-bold text-slate-900">{tambak.nama_tambak}</TableCell>
                      <TableCell className="text-center font-medium text-slate-600">{tambak.lokasi}</TableCell>
                      <TableCell className="text-center font-semibold text-slate-800">
                        {formatNumber(tambak.luas_tambak)} m²
                      </TableCell>
                      <TableCell className="text-center text-slate-500 text-xs max-w-[180px] truncate">
                        {tambak.keterangan || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link href={`/siklus?tambakId=${tambak.tambak_id}`}>
                            <Button variant="ghost" size="icon" className="h-8.5 w-8.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Lihat Siklus">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openEditDialog(tambak)}
                            className="h-8.5 w-8.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                            title="Ubah Data"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openDeleteDialog(tambak)}
                            className="h-8.5 w-8.5 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Hapus Tambak"
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
