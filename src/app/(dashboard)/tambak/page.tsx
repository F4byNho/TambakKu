"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  Building2, 
  Users,
  Layers,
  Maximize2,
  MapPin,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import TambakForm from "@/components/tambak/tambak-form";
import type { TambakInput } from "@/validators/tambak";
import { usePokdakan, type Tambak, type Anggota } from "@/context/pokdakan-context";
import { useRouter } from "next/navigation";

export default function TambakPage() {
  const router = useRouter();
  const { tambakList, anggotaList, activeAnggota, activeTambak, isLoading, refreshData, selectContext } = usePokdakan();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAnggotaFilter, setSelectedAnggotaFilter] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync filter anggota dengan activeAnggota jika ada
  useEffect(() => {
    if (activeAnggota) {
      setSelectedAnggotaFilter(activeAnggota.anggota_id);
    }
  }, [activeAnggota]);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTambak, setSelectedTambak] = useState<Tambak | null>(null);

  const handleAddSubmit = async (data: TambakInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tambak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat tambak baru");

      toast.success("Tambak baru berhasil dibuat!");
      setIsAddOpen(false);
      
      const newTambak: Tambak = json.data;
      if (newTambak) {
        const owner = anggotaList.find(a => a.anggota_id === newTambak.anggota_id) || activeAnggota;
        if (owner) {
          selectContext(owner, newTambak);
        }
      }

      await refreshData();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menyimpan tambak");
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

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memperbarui tambak");

      toast.success("Data tambak berhasil diperbarui!");
      setIsEditOpen(false);
      setSelectedTambak(null);
      await refreshData();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat memperbarui tambak");
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

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus tambak");

      toast.success("Tambak berhasil dihapus!");
      setIsDeleteOpen(false);
      setSelectedTambak(null);
      await refreshData();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menghapus tambak");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter logic aman
  const filteredTambaks = tambakList.filter((t) => {
    const namaTambak = String(t.nama_tambak || "");
    const lokasi = String(t.lokasi || "");
    const matchSearch =
      namaTambak.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lokasi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchAnggota =
      selectedAnggotaFilter === "all" || t.anggota_id === selectedAnggotaFilter;
    return matchSearch && matchAnggota;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Action Bar (Search + Filter + Add Button in 1 Clean Row) */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Cari nama tambak atau lokasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 rounded-xl border-slate-200 bg-white text-xs shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-600"
          />
        </div>

        {/* Filter Anggota (Hanya tampil jika dalam Mode Pokdakan Overview / Belum Pilih Personal) */}
        {!activeAnggota && (
          <select
            value={selectedAnggotaFilter}
            onChange={(e) => setSelectedAnggotaFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 w-full sm:w-auto shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">Semua Anggota Pemilik</option>
            {anggotaList.map((a) => (
              <option key={a.anggota_id} value={a.anggota_id}>
                Milik: {a.nama_anggota}
              </option>
            ))}
          </select>
        )}

        <Button
          onClick={() => setIsAddOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl h-10 px-4 text-xs text-white shrink-0 shadow-xs gap-1.5 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" /> Tambah Tambak
        </Button>
      </div>

      {/* Tambak Cards List */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Memuat data tambak...</p>
          </div>
        </div>
      ) : filteredTambaks.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTambaks.map((tambak) => {
            const owner = anggotaList.find((a) => a.anggota_id === tambak.anggota_id);
            const isActivePond = activeTambak?.tambak_id === tambak.tambak_id;

            return (
              <Card
                key={tambak.tambak_id}
                className={`transition-all shadow-2xs hover:shadow-md rounded-2xl p-4 flex flex-col justify-between bg-white border ${
                  isActivePond
                    ? "border-2 border-blue-500 bg-blue-50/10"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <div className="space-y-3">
                  {/* Header: Status / Owner Badge & Actions */}
                  <div className="flex items-center justify-between gap-2">
                    {isActivePond ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Tambak Aktif
                      </span>
                    ) : !activeAnggota ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                        <Users className="h-3 w-3" /> {owner ? owner.nama_anggota : "Tanpa Pemilik"}
                      </span>
                    ) : tambak.status_tambak === "Istirahat" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Istirahat
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Siap Budidaya
                      </span>
                    )}

                    {/* Edit & Delete Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedTambak(tambak);
                          setIsEditOpen(true);
                        }}
                        className="h-7 w-7 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit Tambak"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedTambak(tambak);
                          setIsDeleteOpen(true);
                        }}
                        className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Tambak"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Title & Luas Metric */}
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-slate-900 capitalize flex items-center gap-2">
                      <Layers className="h-4 w-4 text-blue-600 shrink-0" />
                      {tambak.nama_tambak}
                    </h3>

                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100/80">
                      <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                        <Maximize2 className="h-3.5 w-3.5 text-blue-600" /> Luas Tambak:
                      </span>
                      <span className="font-black text-slate-900 text-xs">
                        {tambak.luas_tambak.toLocaleString("id-ID")} m²
                      </span>
                    </div>

                    {tambak.lokasi && (
                      <div className="flex items-center gap-1.5 text-slate-600 text-xs capitalize pt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{tambak.lokasi}</span>
                      </div>
                    )}

                    {tambak.keterangan && (
                      <p className="text-[11px] text-slate-400 italic capitalize truncate">
                        Catatan: {tambak.keterangan}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Button */}
                <div className="pt-3">
                  {isActivePond ? (
                    <Button
                      onClick={() => router.push("/siklus")}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-10 px-4 shadow-2xs gap-1.5"
                    >
                      <Activity className="h-3.5 w-3.5" /> Kelola Siklus &amp; Budidaya <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        selectContext(owner || null, tambak);
                        router.push("/dashboard");
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-10 px-4 shadow-2xs gap-1.5"
                    >
                      Pilih &amp; Buka Tambak Ini <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-slate-200 p-8 text-center bg-white rounded-2xl shadow-2xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mx-auto mb-3">
            <Layers className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">Belum Ada Tambak Terdaftar</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Daftarkan tambak pertama milik anggota Pokdakan untuk mulai mencatat budidaya dengan tombol "+ Tambah Tambak" di atas.
          </p>
        </Card>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-100 shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {activeAnggota ? `Tambah Tambak (${activeAnggota.nama_anggota})` : "Tambah Tambak Anggota"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {activeAnggota
                ? `Masukkan luas dan detail tambak baru untuk ${activeAnggota.nama_anggota}.`
                : "Pilih anggota pemilik dan masukkan luas tambak (m²)."}
            </DialogDescription>
          </DialogHeader>

          <TambakForm
            initialValues={
              activeAnggota
                ? {
                    nama_tambak: "",
                    anggota_id: activeAnggota.anggota_id,
                    lokasi: "",
                    luas_tambak: "" as any,
                    status_tambak: "Aktif",
                    keterangan: "",
                    catatan: "",
                  }
                : undefined
            }
            onSubmit={handleAddSubmit}
            isLoading={isSubmitting}
            onCancel={() => setIsAddOpen(false)}
            submitLabel="Simpan Tambak"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-100 shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Ubah Data Tambak</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Perbarui pemilik, lokasi, atau luas tambak.
            </DialogDescription>
          </DialogHeader>

          {selectedTambak && (
            <TambakForm
              initialValues={{
                nama_tambak: selectedTambak.nama_tambak,
                anggota_id: selectedTambak.anggota_id,
                lokasi: selectedTambak.lokasi || "",
                luas_tambak: selectedTambak.luas_tambak,
                status_tambak: selectedTambak.status_tambak || "Aktif",
                keterangan: selectedTambak.keterangan || "",
                catatan: selectedTambak.catatan || "",
              }}
              onSubmit={handleEditSubmit}
              isLoading={isSubmitting}
              onCancel={() => {
                setIsEditOpen(false);
                setSelectedTambak(null);
              }}
              submitLabel="Perbarui Tambak"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedTambak(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Hapus Tambak?"
        description={`Apakah Anda yakin ingin menghapus tambak "${selectedTambak?.nama_tambak}"? Seluruh siklus dan transaksi di tambak ini juga akan terhapus.`}
        isLoading={isSubmitting}
      />
    </div>
  );
}
