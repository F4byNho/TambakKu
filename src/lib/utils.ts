import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatIDR(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | string | null | undefined): string {
  if (value === undefined || value === null || value === "") return "0";
  const num = Number(value);
  if (isNaN(num)) return "0";
  return new Intl.NumberFormat("id-ID").format(num);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr === "undefined" || dateStr === "null") return "-";
  try {
    const str = String(dateStr).trim();
    if (!str) return "-";

    // Jika string memiliki 'T', itu adalah timestamp ISO UTC (misal 2026-07-22T17:00:00.000Z).
    // Harus diparse dengan new Date() agar terkonversi ke tanggal lokal user (GMT+7) dengan benar.
    if (!str.includes("T")) {
      // Matching YYYY-MM-DD atau YYYY/MM/DD (hanya string tanggal tanpa jam)
      const matchesISO = str.match(/^(\d{4})[-/\.](0?[1-9]|1[0-2])[-/\.](0?[1-9]|[12]\d|3[01])$/);
      if (matchesISO) {
        const [, year, month, day] = matchesISO;
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }

      // Matching DD/MM/YYYY atau DD-MM-YYYY
      const matchesDMY = str.match(/^(0?[1-9]|[12]\d|3[01])[-/\.](0?[1-9]|1[0-2])[-/\.](\d{4})$/);
      if (matchesDMY) {
        const [, day, month, year] = matchesDMY;
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }
    }

    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return String(dateStr);
  }
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

