import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, Droplets, Wallet, LineChart } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-md shadow-blue-200">
              T
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">TambakKu</span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors px-3 py-2"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="text-sm h-9 px-4 inline-flex items-center justify-center rounded-lg bg-blue-600 text-white font-semibold shadow-sm shadow-blue-200 hover:bg-blue-700 transition-colors"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-16 bg-white border-b border-slate-100">
          <div className="container mx-auto px-4 md:px-8 text-center max-w-3xl">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3.5 py-1 text-xs font-semibold text-slate-700 mb-6 border border-slate-200">
              Aplikasi Pencatatan Budidaya Tambak & Polikultur
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-4 leading-tight">
              Pencatatan Budidaya Tambak Sederhana & Terstruktur
            </h1>
            <p className="text-base md:text-lg text-slate-600 mb-8 max-w-xl mx-auto leading-relaxed font-normal">
              Solusi digital sederhana untuk petambak dalam mencatat kolam, operasional harian, perkembangan komoditas (Udang, Ikan, Rumput Laut), dan perhitungan modal panen.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="w-full sm:w-auto h-11 px-6 inline-flex items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors"
              >
                Masuk ke Aplikasi
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto h-11 px-6 inline-flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Daftar Akun Baru
              </Link>
            </div>
          </div>
        </section>

        {/* 3 Langkah Mudah */}
        <section className="py-12 bg-slate-50">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h2 className="text-xl lg:text-2xl font-bold text-slate-900 mb-1">Panduan 3 Langkah Penggunaan</h2>
              <p className="text-slate-500 text-xs lg:text-sm">Alur praktis untuk mulai mencatat tambak Anda.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {/* Step 1 */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 text-center flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mb-3">
                  1
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Daftarkan Kolam</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Catat nama kolam tambak dan ukurannya (m²) agar data lokasi tersusun rapi.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 text-center flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mb-3">
                  2
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Catat Penebaran & Biaya</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Isi tanggal sebar bibit, biaya pakan harian, obat, dan penimbangan berat komoditas.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 text-center flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mb-3">
                  3
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Hitung Keuntungan Panen</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Masukkan total hasil panen. Sistem akan otomatis menghitung keuntungan bersih.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 bg-slate-50">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl lg:text-3xl font-black text-slate-950 mb-2">Fitur Utama yang Ramah Warga</h2>
              <p className="text-slate-600 text-sm lg:text-base font-medium">Bantu operasional tambak jauh lebih hemat waktu dan transparan.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* Feature 1 */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                  <Droplets className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Daftar Kolam Tambak</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Catat ukuran kolam (m²) dan posisinya agar memudahkan pembagian pemberian pakan dan probiotik.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Pantau Pertumbuhan Komoditas</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Pantau rata-rata berat kultivan (ABW) dan perkiraan jumlah isi per kg (Size) secara teratur.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                  <Wallet className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Hitung Modal & Keuntungan</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Ketahui modal pengeluaran harian dan berapa untung bersih yang didapatkan setelah panen.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 py-6 border-t border-slate-800">
        <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between text-slate-400 text-sm">
          <div className="flex items-center gap-2 mb-3 md:mb-0">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-sm">
              T
            </div>
            <span className="font-bold text-slate-200">TambakKu</span>
          </div>
          <p>© {new Date().getFullYear()} Program Kerja KKN. Hak Cipta Dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}

