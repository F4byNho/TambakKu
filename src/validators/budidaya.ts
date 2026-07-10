import { z } from "zod";

export const benurSchema = z.object({
  tanggal_tebar: z
    .string()
    .min(1, "Tanggal tebar wajib diisi")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)"),
  jenis_udang: z.string().min(2, "Jenis udang minimal 2 karakter"),
  ukuran_PL: z.string().min(1, "Ukuran PL wajib diisi (misal: PL-10)"),
  jumlah_benur: z.coerce
    .number({ message: "Jumlah benur harus berupa angka" })
    .int("Jumlah benur harus berupa bilangan bulat")
    .positive("Jumlah benur harus lebih dari 0"),
  harga_per_ekor: z.coerce
    .number({ message: "Harga per ekor harus berupa angka" })
    .nonnegative("Harga per ekor tidak boleh negatif"),
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
});

export type OperasionalInput = z.infer<typeof operasionalSchema>;

export const samplingSchema = z.object({
  tanggal: z
    .string()
    .min(1, "Tanggal sampling wajib diisi")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)"),
  jumlah_udang: z.coerce
    .number({ message: "Jumlah udang harus berupa angka" })
    .int("Jumlah udang harus berupa bilangan bulat")
    .positive("Jumlah udang harus lebih dari 0"),
  berat_total: z.coerce
    .number({ message: "Berat total sampling harus berupa angka" })
    .positive("Berat total sampling harus lebih dari 0"),
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
});

export type PanenInput = z.infer<typeof panenSchema>;
