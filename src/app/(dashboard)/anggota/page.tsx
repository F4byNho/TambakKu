"use client";

import React, { useState } from "react";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Phone, 
  MapPin, 
  Calendar, 
  Layers, 
  Search,
  CheckCircle2,
  XCircle,
  ArrowRight,
  UserCheck
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import { anggotaSchema, type AnggotaInput } from "@/validators/anggota";
import { usePokdakan, type Anggota } from "@/context/pokdakan-context";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

export default function AnggotaPage() {
  const router = useRouter();
  const { anggotaList, tambakList, isLoading, refreshData, selectContext } = usePokdakan();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAnggota, setSelectedAnggota] = useState<Anggota | null>(null);

  // Add Form
  const {
    register: registerAdd,
    handleSubmit: handleAddSubmit,
    reset: resetAdd,
    formState: { errors: addErrors },
  } = useForm<AnggotaInput>({
    resolver: zodResolver(anggotaSchema) as any,
    defaultValues: {
      nama_anggota: "",
      no_hp: "",
      alamat: "",
      status_keanggotaan: "Aktif",
      tanggal_bergabung: new Date().toISOString().split("T")[0],
      catatan: "",
    },
  });

  // Edit Form
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<AnggotaInput>({
    resolver: zodResolver(anggotaSchema) as any,
  });

  const onAddSubmit = async (data: AnggotaInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/anggota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menambahkan anggota");

      toast.success("Anggota Pokdakan berhasil ditambahkan!");
      setIsAddOpen(false);
      resetAdd();
      await refreshData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEditSubmit = async (data: AnggotaInput) => {
    if (!selectedAnggota) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/anggota/${selectedAnggota.anggota_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memperbarui data anggota");

      toast.success("Data anggota berhasil diperbarui!");
      setIsEditOpen(false);
      setSelectedAnggota(null);
      await refreshData();
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDeleteConfirm = async () => {
    if (!selectedAnggota) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/anggota/${selectedAnggota.anggota_id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus anggota");

      toast.success("Anggota Pokdakan berhasil dihapus!");
      setIsDeleteOpen(false);
      setSelectedAnggota(null);
      await refreshData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus anggota");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (anggota: Anggota) => {
    setSelectedAnggota(anggota);
    resetEdit({
      nama_anggota: anggota.nama_anggota,
      no_hp: anggota.no_hp || "",
      alamat: anggota.alamat || "",
      status_keanggotaan: anggota.status_keanggotaan,
      tanggal_bergabung: anggota.tanggal_bergabung,
      catatan: anggota.catatan || "",
    });
    setIsEditOpen(true);
  };

  const filteredAnggota = anggotaList.filter((a) => {
    const nama = String(a.nama_anggota || "");
    const alamat = String(a.alamat || "");
    return (
      nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alamat.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Action Bar (Search + Add Button in 1 Row - Super Clean) */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Cari nama anggota atau lokasi rumah..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 rounded-xl border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600 shadow-2xs"
          />
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl h-10 px-4 text-xs text-white shrink-0 shadow-xs gap-1.5 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" /> Tambah Anggota
        </Button>
      </div>

      {/* Member Cards Grid */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Memuat data anggota Pokdakan...</p>
          </div>
        </div>
      ) : filteredAnggota.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAnggota.map((anggota) => {
            const memberTambaks = tambakList.filter((t) => t.anggota_id === anggota.anggota_id);
            const totalLuas = memberTambaks.reduce((sum, t) => sum + Number(t.luas_tambak || 0), 0);

            return (
              <Card
                key={anggota.anggota_id}
                className="transition-all shadow-2xs hover:shadow-md rounded-2xl p-4 flex flex-col justify-between bg-white border border-slate-200 hover:border-blue-300"
              >
                <div className="space-y-3">
                  {/* Header: Status Badge & Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        anggota.status_keanggotaan === "Aktif"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {anggota.status_keanggotaan === "Aktif" ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-slate-400" />
                      )}
                      {anggota.status_keanggotaan}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(anggota)}
                        className="h-7 w-7 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit Anggota"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedAnggota(anggota);
                          setIsDeleteOpen(true);
                        }}
                        className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Anggota"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Member Info & Metrics */}
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-slate-900 capitalize flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-600 shrink-0" />
                      {anggota.nama_anggota}
                    </h3>

                    <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 text-xs">
                      {anggota.no_hp && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{anggota.no_hp}</span>
                        </div>
                      )}

                      {anggota.alamat && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate capitalize">{anggota.alamat}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[11px]">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" /> Bergabung:
                        </span>
                        <span className="font-semibold text-slate-700">{formatDate(anggota.tanggal_bergabung)}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50">
                        <span className="text-slate-500 font-semibold flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5 text-blue-600" /> Aset Tambak:
                        </span>
                        <span className="font-bold text-blue-600">
                          {memberTambaks.length} Tambak ({totalLuas.toLocaleString("id-ID")} m²)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Button */}
                <div className="pt-3">
                  <Button
                    onClick={() => {
                      if (memberTambaks.length === 0) {
                        selectContext(anggota, null);
                        router.push("/dashboard");
                      } else if (memberTambaks.length === 1) {
                        selectContext(anggota, memberTambaks[0]);
                        router.push("/dashboard");
                      } else {
                        selectContext(anggota, memberTambaks[0]);
                        router.push("/dashboard");
                      }
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-10 px-4 shadow-2xs gap-1.5"
                  >
                    Pilih &amp; Kelola Tambak <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <Card className="border-slate-200 p-8 text-center bg-white rounded-2xl shadow-2xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mx-auto mb-3">
            <Users className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">Belum Ada Anggota Pokdakan</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Tambahkan anggota Pokdakan pertama Anda (misal: Pak Maskur, Pak Kohar) menggunakan tombol "+ Tambah Anggota" di atas.
          </p>
        </Card>
      )}

      {/* 1. Add Anggota Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-100 shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Tambah Anggota Pokdakan</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Masukkan identitas petambak anggota Pokdakan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit(onAddSubmit)} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="nama_anggota" className="text-xs font-bold text-slate-700">Nama Anggota *</Label>
              <Input
                id="nama_anggota"
                placeholder="Misal: Pak Maskur, Pak Kohar"
                disabled={isSubmitting}
                {...registerAdd("nama_anggota")}
                className={`h-10 rounded-xl text-xs ${addErrors.nama_anggota ? "border-red-500 focus-visible:ring-red-500" : "border-slate-200"}`}
              />
              {addErrors.nama_anggota && (
                <p className="text-xs text-red-500">{addErrors.nama_anggota.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="no_hp" className="text-xs font-bold text-slate-700">Nomor HP / Whatsapp (Opsional)</Label>
              <Input
                id="no_hp"
                placeholder="081234567890"
                disabled={isSubmitting}
                {...registerAdd("no_hp")}
                className="h-10 rounded-xl border-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="alamat" className="text-xs font-bold text-slate-700">Alamat / Lokasi (Opsional)</Label>
              <Input
                id="alamat"
                placeholder="Misal: Dusun Krajan, RT 02 / RW 01"
                disabled={isSubmitting}
                {...registerAdd("alamat")}
                className="h-10 rounded-xl border-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tanggal_bergabung" className="text-xs font-bold text-slate-700">Tanggal Bergabung *</Label>
              <Input
                id="tanggal_bergabung"
                type="date"
                disabled={isSubmitting}
                {...registerAdd("tanggal_bergabung")}
                className="h-10 rounded-xl border-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status_keanggotaan" className="text-xs font-bold text-slate-700">Status Keanggotaan</Label>
              <select
                id="status_keanggotaan"
                disabled={isSubmitting}
                {...registerAdd("status_keanggotaan")}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-3 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={isSubmitting}
                className="rounded-xl font-semibold border-slate-200 text-slate-600 text-xs h-10 w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs h-10 w-full sm:w-auto"
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

      {/* 2. Edit Anggota Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-100 shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Ubah Data Anggota</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Perbarui identitas anggota Pokdakan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit_nama_anggota" className="text-xs font-bold text-slate-700">Nama Anggota *</Label>
              <Input
                id="edit_nama_anggota"
                disabled={isSubmitting}
                {...registerEdit("nama_anggota")}
                className="h-10 rounded-xl border-slate-200 text-xs"
              />
              {editErrors.nama_anggota && (
                <p className="text-xs text-red-500">{editErrors.nama_anggota.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit_no_hp" className="text-xs font-bold text-slate-700">Nomor HP (Opsional)</Label>
              <Input
                id="edit_no_hp"
                disabled={isSubmitting}
                {...registerEdit("no_hp")}
                className="h-10 rounded-xl border-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit_alamat" className="text-xs font-bold text-slate-700">Alamat (Opsional)</Label>
              <Input
                id="edit_alamat"
                disabled={isSubmitting}
                {...registerEdit("alamat")}
                className="h-10 rounded-xl border-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit_tanggal_bergabung" className="text-xs font-bold text-slate-700">Tanggal Bergabung *</Label>
              <Input
                id="edit_tanggal_bergabung"
                type="date"
                disabled={isSubmitting}
                {...registerEdit("tanggal_bergabung")}
                className="h-10 rounded-xl border-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit_status_keanggotaan" className="text-xs font-bold text-slate-700">Status Keanggotaan</Label>
              <select
                id="edit_status_keanggotaan"
                disabled={isSubmitting}
                {...registerEdit("status_keanggotaan")}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-3 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditOpen(false);
                  setSelectedAnggota(null);
                }}
                disabled={isSubmitting}
                className="rounded-xl font-semibold border-slate-200 text-slate-600 text-xs h-10 w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs h-10 w-full sm:w-auto"
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
          setSelectedAnggota(null);
        }}
        onConfirm={onDeleteConfirm}
        title="Hapus Anggota Pokdakan?"
        description={`Apakah Anda yakin ingin menghapus data anggota "${selectedAnggota?.nama_anggota}"? Seluruh tambak milik anggota ini juga akan terhapus.`}
        isLoading={isSubmitting}
      />
    </div>
  );
}
