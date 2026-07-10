import { z } from "zod";

export const siklusSchema = z.object({
  tambak_id: z.string().min(1, "Tambak wajib dipilih"),
  nomor_siklus: z.coerce
    .number({ message: "Nomor siklus harus berupa angka" })
    .int("Nomor siklus harus berupa bilangan bulat")
    .positive("Nomor siklus harus lebih dari 0"),
  tanggal_mulai: z
    .string()
    .min(1, "Tanggal mulai wajib diisi")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)"),
});

export const endSiklusSchema = z.object({
  tanggal_selesai: z
    .string()
    .min(1, "Tanggal selesai wajib diisi")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)"),
  status: z.enum(["aktif", "selesai"]),
});

export type SiklusInput = z.infer<typeof siklusSchema>;
export type EndSiklusInput = z.infer<typeof endSiklusSchema>;
