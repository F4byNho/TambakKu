"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface Anggota {
  anggota_id: string;
  user_id: string;
  nama_anggota: string;
  no_hp?: string;
  alamat?: string;
  status_keanggotaan: "Aktif" | "Nonaktif";
  tanggal_bergabung: string;
  catatan?: string;
}

export interface Tambak {
  tambak_id: string;
  user_id: string;
  anggota_id?: string;
  nama_tambak: string;
  luas_tambak: number;
  lokasi?: string;
  status_tambak?: "Aktif" | "Istirahat";
  keterangan?: string;
  catatan?: string;
  nama_anggota?: string;
}

interface PokdakanContextType {
  activeAnggota: Anggota | null;
  activeTambak: Tambak | null;
  anggotaList: Anggota[];
  tambakList: Tambak[];
  isLoading: boolean;
  selectContext: (anggota: Anggota | null, tambak: Tambak | null) => void;
  clearActiveContext: () => void;
  refreshData: () => Promise<void>;
}

const PokdakanContext = createContext<PokdakanContextType | undefined>(undefined);

const LOCAL_STORAGE_ANGGOTA_KEY = "tambakku_active_anggota_id";
const LOCAL_STORAGE_TAMBAK_KEY = "tambakku_active_tambak_id";

export function PokdakanProvider({ children }: { children: React.ReactNode }) {
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
  const [tambakList, setTambakList] = useState<Tambak[]>([]);
  const [activeAnggota, setActiveAnggota] = useState<Anggota | null>(null);
  const [activeTambak, setActiveTambak] = useState<Tambak | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resAnggota, resTambak] = await Promise.all([
        fetch("/api/anggota"),
        fetch("/api/tambak"),
      ]);

      const jsonAnggota = await resAnggota.json();
      const jsonTambak = await resTambak.json();

      const fetchedAnggota: Anggota[] = jsonAnggota.data || [];
      const fetchedTambak: Tambak[] = jsonTambak.data || [];

      setAnggotaList(fetchedAnggota);
      setTambakList(fetchedTambak);

      // Restore saved active context from localStorage
      const savedAnggotaId = localStorage.getItem(LOCAL_STORAGE_ANGGOTA_KEY);
      const savedTambakId = localStorage.getItem(LOCAL_STORAGE_TAMBAK_KEY);

      if (savedTambakId && fetchedTambak.length > 0) {
        const foundTambak = fetchedTambak.find((t) => t.tambak_id === savedTambakId);
        if (foundTambak) {
          setActiveTambak(foundTambak);
          const foundAnggota = fetchedAnggota.find((a) => a.anggota_id === foundTambak.anggota_id);
          setActiveAnggota(foundAnggota || null);
        } else {
          localStorage.removeItem(LOCAL_STORAGE_TAMBAK_KEY);
        }
      }

      // Check if current activeAnggota (or savedAnggotaId) has tambaks available
      const targetAnggotaId = savedAnggotaId || (activeAnggota ? activeAnggota.anggota_id : null);
      if (targetAnggotaId && fetchedTambak.length > 0) {
        const memberTambaks = fetchedTambak.filter((t) => t.anggota_id === targetAnggotaId);
        if (memberTambaks.length > 0) {
          // If activeTambak is currently null or invalid, select the first tambak of this member!
          setActiveTambak((prev) => {
            if (!prev || !memberTambaks.some(t => t.tambak_id === prev.tambak_id)) {
              localStorage.setItem(LOCAL_STORAGE_TAMBAK_KEY, memberTambaks[0].tambak_id);
              return memberTambaks[0];
            }
            return prev;
          });
        }
      }
    } catch (err: any) {
      console.error("Gagal memuat konteks Pokdakan:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const selectContext = (anggota: Anggota | null, tambak: Tambak | null) => {
    setActiveAnggota(anggota);
    setActiveTambak(tambak);

    if (anggota) {
      localStorage.setItem(LOCAL_STORAGE_ANGGOTA_KEY, anggota.anggota_id);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_ANGGOTA_KEY);
    }

    if (tambak) {
      localStorage.setItem(LOCAL_STORAGE_TAMBAK_KEY, tambak.tambak_id);
      if (tambak.anggota_id && !anggota) {
        const owner = anggotaList.find((a) => a.anggota_id === tambak.anggota_id);
        if (owner) {
          setActiveAnggota(owner);
          localStorage.setItem(LOCAL_STORAGE_ANGGOTA_KEY, owner.anggota_id);
        }
      }
    } else {
      localStorage.removeItem(LOCAL_STORAGE_TAMBAK_KEY);
    }
  };

  const clearActiveContext = () => {
    setActiveAnggota(null);
    setActiveTambak(null);
    localStorage.removeItem(LOCAL_STORAGE_ANGGOTA_KEY);
    localStorage.removeItem(LOCAL_STORAGE_TAMBAK_KEY);
  };

  return (
    <PokdakanContext.Provider
      value={{
        activeAnggota,
        activeTambak,
        anggotaList,
        tambakList,
        isLoading,
        selectContext,
        clearActiveContext,
        refreshData,
      }}
    >
      {children}
    </PokdakanContext.Provider>
  );
}

export function usePokdakan() {
  const context = useContext(PokdakanContext);
  if (!context) {
    throw new Error("usePokdakan must be used within a PokdakanProvider");
  }
  return context;
}
