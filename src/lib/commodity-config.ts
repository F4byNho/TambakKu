export interface CommodityConfig {
  name: string;
  stockingLabel: string;
  stockingDateLabel: string;
  stockingNameLabel: string;
  stockingNamePlaceholder: string;
  stockingSizeLabel: string;
  stockingSizePlaceholder: string;
  stockingQtyLabel: string;
  stockingPriceLabel: string;
  stockingQtyUnit: string;
  
  growthLabel: string;
  growthQtyLabel: string;
  growthWeightLabel: string;
  showSizeField: boolean;
  abwLabel: string;
  sizeLabel: string;
  
  harvestLabel: string;
  harvestWeightLabel: string;
  harvestPriceLabel: string;
}

export const COMMODITY_TYPES = [
  { value: "udang", label: "Udang" },
  { value: "ikan", label: "Ikan (Bandeng, Nila, Kakap, Kerapu, dll.)" },
  { value: "rumput_laut", label: "Rumput Laut" },
  { value: "lainnya", label: "Lainnya (Kepiting, Kerang, Kustom)" }
];

export const COMMODITY_CONFIGS: Record<string, CommodityConfig> = {
  udang: {
    name: "Udang",
    stockingLabel: "Penebaran Benur",
    stockingDateLabel: "Tanggal Tebar",
    stockingNameLabel: "Varietas Udang",
    stockingNamePlaceholder: "Misal: Vaname, Windu",
    stockingSizeLabel: "Ukuran PL",
    stockingSizePlaceholder: "Misal: PL-10, PL-12",
    stockingQtyLabel: "Jumlah Benur (ekor)",
    stockingPriceLabel: "Harga / Ekor (Rp)",
    stockingQtyUnit: "ekor",
    
    growthLabel: "Sampling Udang",
    growthQtyLabel: "Jumlah Udang",
    growthWeightLabel: "Berat Total (gram)",
    showSizeField: true,
    abwLabel: "Average Body Weight (ABW) (g)",
    sizeLabel: "Size (ekor/kg)",
    
    harvestLabel: "Panen Udang",
    harvestWeightLabel: "Berat Panen (kg)",
    harvestPriceLabel: "Harga Jual / kg (Rp)"
  },
  ikan: {
    name: "Ikan",
    stockingLabel: "Penebaran Benih / Nener",
    stockingDateLabel: "Tanggal Tebar",
    stockingNameLabel: "Varietas Ikan",
    stockingNamePlaceholder: "Misal: Bandeng, Nila, Kakap, Kerapu",
    stockingSizeLabel: "Ukuran Benih",
    stockingSizePlaceholder: "Misal: Nener, 2-3 cm, 4-5 cm",
    stockingQtyLabel: "Jumlah Benih (ekor)",
    stockingPriceLabel: "Harga Benih / Ekor (Rp)",
    stockingQtyUnit: "ekor",
    
    growthLabel: "Sampling Ikan",
    growthQtyLabel: "Jumlah Ikan",
    growthWeightLabel: "Berat Total (gram)",
    showSizeField: false,
    abwLabel: "Average Body Weight (ABW) (g)",
    sizeLabel: "Tidak Digunakan",
    
    harvestLabel: "Panen Ikan",
    harvestWeightLabel: "Berat Panen (kg)",
    harvestPriceLabel: "Harga Jual / kg (Rp)"
  },
  bandeng: {
    name: "Ikan",
    stockingLabel: "Penebaran Benih",
    stockingDateLabel: "Tanggal Tebar",
    stockingNameLabel: "Varietas Benih",
    stockingNamePlaceholder: "Misal: Bandeng Lokal",
    stockingSizeLabel: "Ukuran Benih",
    stockingSizePlaceholder: "Misal: Nener, 2-3 cm, 4-5 cm",
    stockingQtyLabel: "Jumlah Benih (ekor)",
    stockingPriceLabel: "Harga Benih / Ekor (Rp)",
    stockingQtyUnit: "ekor",
    
    growthLabel: "Sampling Bandeng",
    growthQtyLabel: "Jumlah Bandeng",
    growthWeightLabel: "Berat Total (gram)",
    showSizeField: false,
    abwLabel: "Average Body Weight (ABW) (g)",
    sizeLabel: "Tidak Digunakan",
    
    harvestLabel: "Panen Bandeng",
    harvestWeightLabel: "Berat Panen (kg)",
    harvestPriceLabel: "Harga Jual / kg (Rp)"
  },
  rumput_laut: {
    name: "Rumput Laut",
    stockingLabel: "Penanaman Bibit",
    stockingDateLabel: "Tanggal Tanam",
    stockingNameLabel: "Varietas Bibit",
    stockingNamePlaceholder: "Misal: Gracilaria, Cottonii",
    stockingSizeLabel: "Metode Penanaman",
    stockingSizePlaceholder: "Misal: Longline, Rak Terapung, Lepas Dasar",
    stockingQtyLabel: "Berat Bibit (kg)",
    stockingPriceLabel: "Harga Bibit / kg (Rp)",
    stockingQtyUnit: "kg",
    
    growthLabel: "Monitoring Pertumbuhan",
    growthQtyLabel: "Jumlah Rumpun Sample",
    growthWeightLabel: "Berat Sample Total (gram)",
    showSizeField: false,
    abwLabel: "Berat Thallus Rata-rata (g)",
    sizeLabel: "Tidak Digunakan",
    
    harvestLabel: "Panen Rumput Laut",
    harvestWeightLabel: "Berat Panen (kg)",
    harvestPriceLabel: "Harga Jual / kg (Rp)"
  },
  lainnya: {
    name: "Komoditas Lainnya",
    stockingLabel: "Penebaran / Penanaman Awal",
    stockingDateLabel: "Tanggal Tebar/Tanam",
    stockingNameLabel: "Nama Kategori / Varietas",
    stockingNamePlaceholder: "Misal: Kepiting Soka, Kerang Hijau, dll.",
    stockingSizeLabel: "Keterangan Ukuran / Metode",
    stockingSizePlaceholder: "Misal: Bibit 100g, Metode Karamba",
    stockingQtyLabel: "Jumlah / Berat Awal",
    stockingPriceLabel: "Harga Satuan / Ekor / kg (Rp)",
    stockingQtyUnit: "unit/kg",
    
    growthLabel: "Sampling & Pertumbuhan",
    growthQtyLabel: "Jumlah Sampel",
    growthWeightLabel: "Berat Sample Total (gram)",
    showSizeField: false,
    abwLabel: "Berat Rata-rata (g)",
    sizeLabel: "Ukuran / Kelas",
    
    harvestLabel: "Panen Komoditas",
    harvestWeightLabel: "Hasil Panen Total (kg)",
    harvestPriceLabel: "Harga Jual / kg (Rp)"
  }
};

export function getCommodityConfig(type: string): CommodityConfig {
  return COMMODITY_CONFIGS[type] || COMMODITY_CONFIGS.lainnya;
}
