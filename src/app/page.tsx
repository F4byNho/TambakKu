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
        <section className="relative overflow-hidden pt-10 pb-12 lg:pt-16 lg:pb-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/50 via-slate-50 to-slate-50 -z-10"></div>
          <div className="container mx-auto px-4 md:px-8 text-center max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 mb-4 leading-tight">
              Tingkatkan Hasil Panen Udang dengan <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Pencatatan Presisi</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Platform digital yang dirancang khusus untuk mempermudah petambak udang vaname skala kecil hingga menengah dalam mengelola kolam, memantau siklus budidaya, dan mencatat keuangan operasional.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto h-12 px-8 inline-flex items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-base shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 hover:-translate-y-0.5 transition-all duration-200"
              >
                Mulai Sekarang
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto h-12 px-8 inline-flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-base hover:bg-slate-50 transition-colors"
              >
                Masuk ke Dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-10 lg:py-12 bg-white border-y border-slate-100">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-950 mb-3">Solusi Lengkap untuk Tambak Anda</h2>
              <p className="text-slate-500 text-sm lg:text-base">Kelola operasional tambak jauh lebih mudah, efisien, dan transparan dalam satu platform digital terpadu.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* Feature 1 */}
              <div className="bg-slate-50 rounded-2xl p-5 lg:p-6 border border-slate-100 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 lg:mb-5">
                  <Droplets className="h-5 w-5 lg:h-6 lg:w-6" />
                </div>
                <h3 className="text-lg lg:text-xl font-bold text-slate-900 mb-2">Manajemen Kolam</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  Daftarkan seluruh kolam tambak Anda beserta informasi spesifik seperti luas, lokasi, dan daya tampung. Semua aset tercatat rapi.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-slate-50 rounded-2xl p-5 lg:p-6 border border-slate-100 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 lg:mb-5">
                  <BarChart3 className="h-5 w-5 lg:h-6 lg:w-6" />
                </div>
                <h3 className="text-lg lg:text-xl font-bold text-slate-900 mb-2">Pantau Siklus Budidaya</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  Catat tanggal mulai penebaran benur hingga tanggal panen. Lacak perkembangan harian, sampling ukuran, serta tingkat kelangsungan hidup (SR).
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-slate-50 rounded-2xl p-5 lg:p-6 border border-slate-100 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 lg:mb-5">
                  <Wallet className="h-5 w-5 lg:h-6 lg:w-6" />
                </div>
                <h3 className="text-lg lg:text-xl font-bold text-slate-900 mb-2">Pembukuan Terpusat</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  Kelola dan catat setiap pengeluaran mulai dari pakan, probiotik, hingga operasional harian. Ketahui secara pasti modal yang dikeluarkan.
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

