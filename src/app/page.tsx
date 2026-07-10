import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 font-sans p-6 text-slate-900">
      <main className="flex w-full max-w-xl flex-col items-center text-center bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 p-8 md:p-12">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white font-bold text-2xl shadow-lg shadow-blue-200 mb-6">
          T
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 mb-2">
          TambakKu
        </h1>
        <p className="text-sm font-medium text-blue-600 mb-6 uppercase tracking-wider">
          Digitalisasi Budidaya Udang & Pembukuan Tambak
        </p>
        <p className="text-slate-600 leading-relaxed mb-8">
          Aplikasi berbasis web untuk digitalisasi pencatatan budidaya udang vaname dan pembukuan usaha tambak skala kecil hingga menengah.
        </p>
        
        <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-left mb-8">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Status Proyek (Tahap 1-5 Selesai)
          </h2>
          <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Next.js & Dashboard Berhasil Dikonfigurasi
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full mb-8">
          <a
            href="/login"
            className="flex-1 flex h-11 items-center justify-center rounded-xl bg-blue-600 text-white font-semibold shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors"
          >
            Masuk Akun
          </a>
          <a
            href="/register"
            className="flex-1 flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            Daftar Baru
          </a>
        </div>

        <div className="text-xs text-slate-400">
          Program Kerja KKN - TambakKu &copy; {new Date().getFullYear()}
        </div>
      </main>
    </div>
  );
}

