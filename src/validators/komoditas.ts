import { z } from "zod";

export const komoditasSchema = z.object({
  nama_komoditas: z.string().min(1, "Nama komoditas wajib diisi"),
  jenis_komoditas: z.enum(["udang", "ikan", "rumput_laut", "bandeng", "lainnya"], { message: "Jenis komoditas tidak valid" }),
  tanggal_mulai: z
    .string()
    .min(1, "Tanggal mulai wajib diisi")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)"),
  status: z.string().optional().default("aktif"),
});

export type KomoditasInput = z.infer<typeof komoditasSchema>;
