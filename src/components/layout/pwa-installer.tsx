"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, Share, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if already running as standalone app
    const checkStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    // 2. Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // 3. Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.log("Service Worker registration failed:", err);
        });
    }

    // 4. Capture beforeinstallprompt event for Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If iOS and not standalone, show custom banner after 2 seconds
    if (iosDevice && !checkStandalone) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
  };

  if (isStandalone || !showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-in slide-in-from-bottom duration-300 md:hidden">
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-800 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-extrabold text-lg text-white shadow-xs">
              T
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-blue-400" />
                Install Aplikasi TambakKu
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-snug font-normal">
                Pasang di Layar Utama HP Anda untuk akses cepat & pencatatan praktis.
              </p>
            </div>
          </div>
          <button
            onClick={dismissBanner}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action button for Android / Chrome */}
        {deferredPrompt ? (
          <div className="flex items-center gap-2 pt-1 w-full">
            <Button
              onClick={handleInstallClick}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 rounded-xl shadow-xs gap-2"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span className="truncate">Download & Install di HP</span>
            </Button>
            <Button
              variant="outline"
              onClick={dismissBanner}
              className="shrink-0 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 text-xs h-10 rounded-xl px-4"
            >
              Nanti
            </Button>
          </div>
        ) : isIOS ? (
          /* Instructions for iOS Safari */
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-[11px] text-slate-300 leading-relaxed space-y-1">
            <p className="font-bold text-blue-300 flex items-center gap-1">
              <Share className="h-3.5 w-3.5" /> Cara Install di iPhone (Safari):
            </p>
            <ol className="list-decimal list-inside space-y-0.5 text-slate-300">
              <li>Tekan tombol <strong>Bagikan / Share</strong> di bawah browser Safari.</li>
              <li>Pilih menu <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</li>
            </ol>
          </div>
        ) : null}
      </div>
    </div>
  );
}
