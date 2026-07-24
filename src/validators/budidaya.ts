import { z } from "zod";

export const benurSchema = z.object({
  tanggal_tebar: z
    .string()
    .min(1, "Tanggal wajib diisi")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)"),
  jenis_udang: z.string().min(1, "Varietas/jenis komoditas wajib diisi"),
  ukuran_PL: z.string().min(1, "Ukuran/metode penanaman wajib diisi"),
  asal_benih: z.string().optional().or(z.literal("")),
  jumlah_benur: z.coerce
    .number({ message: "Jumlah/berat harus berupa angka" })
    .positive("Jumlah/berat harus lebih dari 0"),
  harga_per_ekor: z.coerce
    .number({ message: "Harga satuan harus berupa angka" })
    .nonnegative("Harga tidak boleh negatif"),
  komoditas_id: z.string().min(1, "Komoditas wajib dipilih"),
});

export type BenurInput = z.infer<typeof benurSchema>;

export const operasionalSchema = z.object({
  tanggal: z
    .string()
    .min(1, "Tanggal wajib diisi")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)"),
  kategori: z.string().min(1, "Nama pengeluaran wajib diisi"),
  nominal: z.coerce
    .number({ message: "Nominal biaya harus berupa angka" })
    .nonnegative("Nominal biaya tidak boleh negatif"),
  keterangan: z.string().optional().or(z.literal("")),
  komoditas_id: z.string().optional().or(z.literal("")),
});

export type OperasionalInput = z.infer<typeof operasionalSchema>;

export const samplingSchema = z.object({
  tanggal: z
    .string()
    .min(1, "Tanggal sampling wajib diisi")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)"),
  jumlah_udang: z.coerce
    .number({ message: "Jumlah harus berupa angka" })
    .nonnegative("Jumlah tidak boleh negatif"),
  berat_total: z.coerce
    .number({ message: "Berat total sampling harus berupa angka" })
    .positive("Berat total sampling harus lebih dari 0"),
  abw: z.coerce.number().optional(),
  size: z.coerce.number().optional(),
  komoditas_id: z.string().min(1, "Komoditas wajib dipilih"),
});

export type SamplingInput = z.infer<typeof samplingSchema>;

export const panenSchema = z.object({
  tanggal: z
    .string()
    .min(1, "Tanggal panen wajib diisi")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)"),
  berat_panen: z.coerce
    .number({ message: "Berat panen harus berupa angka" })
    .positive("Berat panen harus lebih dari 0"),
  harga_jual: z.coerce
    .number({ message: "Harga jual per kg harus berupa angka" })
    .nonnegative("Harga jual tidak boleh negatif"),
  size: z.coerce
    .number({ message: "Size (ekor/kg) harus berupa angka" })
    .optional()
    .or(z.literal("")),
  komoditas_id: z.string().min(1, "Komoditas wajib dipilih"),
  jumlah_ekor: z.coerce.number().optional(),
  pendapatan: z.coerce.number().optional(),
  sr_percent: z.coerce.number().optional(),
});

export type PanenInput = z.infer<typeof panenSchema>;
