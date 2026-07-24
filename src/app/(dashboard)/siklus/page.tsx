"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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
  Building2,
  Users,
  Layers,
  ArrowRight,
  UserCheck
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
import { usePokdakan } from "@/context/pokdakan-context";

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

function SiklusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeTambak, activeAnggota, anggotaList, tambakList, selectContext } = usePokdakan();

  const [cycles, setCycles] = useState<SiklusItem[]>([]);
  const [tambaks, setTambaks] = useState<TambakItem[]>([]);
  const [filteredCycles, setFilteredCycles] = useState<SiklusItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
      tambak_id: activeTambak?.tambak_id || "",
      nomor_siklus: 1,
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
    fetchSiklusData();
  }, [activeTambak, activeAnggota]);

  useEffect(() => {
    applyFilters();
  }, [cycles, activeTambak, activeAnggota, statusFilter, searchQuery]);

  const fetchSiklusData = async () => {
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

    // Filter Tambak Aktif atau Anggota Aktif Context
    if (activeTambak) {
      result = result.filter((c) => c.tambak_id === activeTambak.tambak_id);
    } else if (activeAnggota) {
      const memberTambakIds = new Set(
        tambaks.filter((t: any) => t.anggota_id === activeAnggota.anggota_id).map((t: any) => t.tambak_id)
      );
      result = result.filter((c) => memberTambakIds.has(c.tambak_id));
    }

    // Filter Status
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Filter Search
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

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memulai siklus baru");

      toast.success("Siklus budidaya berhasil dimulai!");
      setIsAddOpen(false);
      resetAdd();
      await fetchSiklusData();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat memulai siklus");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEndSubmit = async (data: EndSiklusInput) => {
    if (!selectedCycle) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/siklus/${selectedCycle.siklus_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal_selesai: data.tanggal_selesai,
          status: "selesai",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengakhiri siklus");

      toast.success("Siklus budidaya berhasil diakhiri (Panen/Selesai)");
      setIsEndOpen(false);
      setSelectedCycle(null);
      await fetchSiklusData();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat mengakhiri siklus");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDeleteConfirm = async () => {
    if (!selectedCycle) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/siklus/${selectedCycle.siklus_id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus siklus");

      toast.success("Data siklus berhasil dihapus!");
      setIsDeleteOpen(false);
      setSelectedCycle(null);
      await fetchSiklusData();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menghapus siklus");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!activeTambak && !activeAnggota && !isLoading) {
      router.push("/dashboard");
    }
  }, [activeTambak, activeAnggota, isLoading, router]);

  // ─── KONDISI 1: JIKA BELUM PILIH ANGGOTA (Direct Redirect ke Dashboard Unpersonal) ─
  if (!activeTambak && !activeAnggota) {
    return (
      <div className="flex h-[65vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-500">Mengalihkan ke Dashboard Pokdakan...</p>
        </div>
      </div>
    );
  }

  // ─── KONDISI 2: ANGGOTA DIPILIH TAPI BELUM PUNYA TAMBAK ─────────────────
  if (!activeTambak) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-lg mx-auto space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
          <Layers className="h-7 w-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Belum Memiliki Aset Tambak</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Anggota <strong className="text-slate-700 font-semibold">{activeAnggota?.nama_anggota}</strong> belum memiliki aset tambak terdaftar. Tambahkan tambak pertama untuk mulai mengelola siklus budidaya.
          </p>
        </div>
        <Button
          onClick={() => router.push("/tambak")}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-10 px-5"
        >
          + Tambah Tambak Pertama
        </Button>
      </div>
    );
  }

  // ─── KONDISI 2: TAMBAK AKTIF DIPILIH (Context Ready) ─────────────────────
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Context Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold border border-blue-100">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 capitalize">
              {activeTambak.nama_tambak}
              <span className="text-xs font-normal text-slate-500">• Luas: {activeTambak.luas_tambak.toLocaleString("id-ID")} m²</span>
            </h3>
            {activeAnggota && (
              <p className="text-xs text-slate-500 font-medium">
                Pemilik: <span className="font-semibold text-slate-700">{activeAnggota.nama_anggota}</span>
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={() => {
            resetAdd({
              tambak_id: activeTambak.tambak_id,
              nomor_siklus: cycles.filter((c) => c.tambak_id === activeTambak.tambak_id).length + 1,
              tanggal_mulai: new Date().toISOString().split("T")[0],
            });
            setIsAddOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl h-10 px-4 text-xs text-white shrink-0 shadow-2xs gap-1.5"
        >
          <Plus className="h-4 w-4" /> Mulai Siklus Baru
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Cari nomor siklus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-xl border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600 shadow-2xs"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="all">Semua Status (Aktif &amp; Selesai)</option>
          <option value="aktif">Status Aktif</option>
          <option value="selesai">Status Selesai (Panen)</option>
        </select>
      </div>

      {/* Grid Data Siklus Budidaya */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Memuat data siklus budidaya...</p>
          </div>
        </div>
      ) : paginatedCycles.length > 0 ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedCycles.map((c) => {
              const isAktif = c.status === "aktif";

              return (
                <Card
                  key={c.siklus_id}
                  className={`transition-all shadow-2xs hover:shadow-md rounded-2xl p-4 flex flex-col justify-between bg-white border ${
                    isAktif
                      ? "border-2 border-emerald-500 bg-emerald-50/10"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header Badge & Action Buttons */}
                    <div className="flex items-center justify-between gap-2">
                      {isAktif ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          Siklus Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
                          <CheckCircle className="h-3.5 w-3.5 text-slate-400" />
                          Panen / Selesai
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        {isAktif && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedCycle(c);
                              resetEnd({
                                tanggal_selesai: new Date().toISOString().split("T")[0],
                                status: "selesai",
                              });
                              setIsEndOpen(true);
                            }}
                            className="h-7 px-2 text-amber-700 hover:bg-amber-50 rounded-lg text-xs font-bold gap-1"
                            title="Akhiri Siklus (Panen)"
                          >
                            <CheckCircle className="h-3.5 w-3.5 text-amber-600" /> Akhiri
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelectedCycle(c);
                            setIsDeleteOpen(true);
                          }}
                          className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Siklus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Title & Info Box */}
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-slate-900 capitalize flex items-center gap-2">
                        <Activity className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                        Siklus Budidaya #{c.nomor_siklus}
                      </h3>

                      <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100/80 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="font-semibold text-slate-500">Tanggal Mulai:</span>
                          <span className="font-bold text-slate-900">{formatDate(c.tanggal_mulai)}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600 pt-1.5 border-t border-slate-200/50">
                          <span className="font-semibold text-slate-500">Tanggal Selesai:</span>
                          <span className="font-bold text-slate-900">
                            {c.tanggal_selesai ? formatDate(c.tanggal_selesai) : <span className="text-slate-400 font-normal">Sedang Berjalan</span>}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-3">
                    <Link href={`/siklus/${c.siklus_id}`}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-10 px-4 shadow-2xs gap-1.5">
                        <Eye className="h-3.5 w-3.5" /> Buka &amp; Kelola Siklus <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-500">
                Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredCycles.length)} dari {filteredCycles.length} siklus
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-bold px-2 text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 rounded-lg"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card className="border border-slate-200 p-8 text-center bg-white rounded-2xl shadow-2xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mx-auto mb-3">
            <Activity className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">Belum Ada Siklus Budidaya</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed">
            Klik tombol "+ Mulai Siklus Baru" di atas untuk memulai pencatatan siklus pertama pada tambak {activeTambak.nama_tambak}.
          </p>
        </Card>
      )}

      {/* Modal Add Siklus */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-100 shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Mulai Siklus Budidaya Baru</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Siklus baru untuk tambak <strong className="capitalize">{activeTambak.nama_tambak}</strong> ({activeAnggota?.nama_anggota}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit(onAddSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="nomor_siklus" className="text-xs font-bold text-slate-700">Nomor Siklus *</Label>
              <Input
                id="nomor_siklus"
                type="number"
                disabled={isSubmitting}
                {...registerAdd("nomor_siklus", { valueAsNumber: true })}
                className="h-10 rounded-xl text-xs border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tanggal_mulai" className="text-xs font-bold text-slate-700">Tanggal Mulai Siklus *</Label>
              <Input
                id="tanggal_mulai"
                type="date"
                disabled={isSubmitting}
                {...registerAdd("tanggal_mulai")}
                className="h-10 rounded-xl text-xs border-slate-200"
              />
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
                  "Mulai Siklus"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal End Siklus */}
      <Dialog open={isEndOpen} onOpenChange={setIsEndOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-100 shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Akhiri Siklus Budidaya</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tandai siklus ini telah panen / selesai.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEndSubmit(onEndSubmit)} className="space-y-4 pt-2">
            <input type="hidden" {...registerEnd("status")} value="selesai" />
            <div className="space-y-1.5">
              <Label htmlFor="tanggal_selesai" className="text-xs font-bold text-slate-700">Tanggal Selesai / Panen *</Label>
              <Input
                id="tanggal_selesai"
                type="date"
                disabled={isSubmitting}
                {...registerEnd("tanggal_selesai")}
                className={`h-10 rounded-xl text-xs ${endErrors.tanggal_selesai ? "border-red-500" : "border-slate-200"}`}
              />
              {endErrors.tanggal_selesai && (
                <p className="text-xs text-red-500">{endErrors.tanggal_selesai.message}</p>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-3 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEndOpen(false)}
                disabled={isSubmitting}
                className="rounded-xl font-semibold border-slate-200 text-slate-600 text-xs h-10 w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white text-xs h-10 w-full sm:w-auto"
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

      {/* Modal Delete Siklus */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedCycle(null);
        }}
        onConfirm={onDeleteConfirm}
        title="Hapus Siklus Budidaya?"
        description={`Apakah Anda yakin ingin menghapus Siklus #${selectedCycle?.nomor_siklus}? Seluruh komoditas dan riwayat benur, operasional, sampling, dan panen di siklus ini akan terhapus.`}
        isLoading={isSubmitting}
      />
    </div>
  );
}

export default function SiklusPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[75vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-500">Memuat halaman siklus...</p>
        </div>
      </div>
    }>
      <SiklusContent />
    </Suspense>
  );
}
