import { z } from "zod";

export const tambakSchema = z.object({
  nama_tambak: z.string().min(3, "Nama tambak minimal 3 karakter"),
  lokasi: z.string().min(3, "Lokasi minimal 3 karakter"),
  luas_tambak: z
    .number({ message: "Luas tambak harus berupa angka" })
    .positive("Luas tambak harus berupa angka positif lebih dari 0"),
  keterangan: z.string().optional().or(z.literal("")),
});

export type TambakInput = z.infer<typeof tambakSchema>;
