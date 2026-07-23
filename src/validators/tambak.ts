import { z } from "zod";

export const tambakSchema = z.object({
  nama_tambak: z.string().min(2, "Nama tambak minimal 2 karakter"),
  anggota_id: z.string().min(1, "Pemilik tambak (Anggota) wajib dipilih"),
  lokasi: z.string().optional().or(z.literal("")),
  luas_tambak: z
    .number({ message: "Luas tambak harus berupa angka" })
    .positive("Luas tambak harus berupa angka positif lebih dari 0"),
  status_tambak: z.enum(["Aktif", "Istirahat"]).default("Aktif"),
  keterangan: z.string().optional().or(z.literal("")),
  catatan: z.string().optional().or(z.literal("")),
});

export type TambakInput = z.infer<typeof tambakSchema>;
