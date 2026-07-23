import { z } from "zod";

export const anggotaSchema = z.object({
  nama_anggota: z.string().min(1, "Nama anggota wajib diisi"),
  no_hp: z.string().optional().or(z.literal("")),
  alamat: z.string().optional().or(z.literal("")),
  status_keanggotaan: z.enum(["Aktif", "Nonaktif"]).default("Aktif"),
  tanggal_bergabung: z
    .string()
    .min(1, "Tanggal bergabung wajib diisi")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)"),
  catatan: z.string().optional().or(z.literal("")),
});

export type AnggotaInput = z.infer<typeof anggotaSchema>;
