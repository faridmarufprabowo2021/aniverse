"use client";

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      console.log("[AniVerse SW] Terdaftar:", reg.scope);

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        newWorker?.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // Ada update tersedia — bisa tampilkan toast
            console.log("[AniVerse SW] Update tersedia. Refresh untuk versi terbaru.");
          }
        });
      });
    } catch (err) {
      console.error("[AniVerse SW] Gagal mendaftar:", err);
    }
  });
}
