# AniVerse 🌌 - Tracker Anime & Komik Indonesia (PWA Ready)

AniVerse adalah web tracker anime dan komik modern yang kaya fitur, dirancang khusus untuk komunitas anime di Indonesia. Dengan integrasi data real-time, dashboard statistik pengguna, pemutar video multi-provider bawaan, pembaca manga, dan dukungan PWA penuh.

---

## ✨ Fitur Utama

### 1. 📺 Streaming Anime Multi-Provider (In-App Player)
*   Integrasi pemutar video kustom pintar dengan pencarian otomatis di 5 provider lokal:
    *   **Samehadaku** (Utama, Blogger Player bebas iklan)
    *   **Stream Indo** (GDrive & MP4Upload)
    *   **OtakuDesu** (Sub Indo lengkap)
    *   **Oploverz**
    *   **Winbu**
*   Fitur auto-play episode selanjutnya dan tombol *Skip Intro* (90 detik pertama).
*   *Smart Redirect* ke web pencarian provider jika terjadi pemblokiran.

### 2. 📖 Pembaca Manga (Komikindo & Default API)
*   Sistem pembaca manga sub-indo langsung di dalam aplikasi.
*   Mendukung pencarian komik, daftar rilis terbaru, detail chapter, navigasi antar chapter, dan mode pembaca bersih.
*   Proxy server-side bypass hotlink protection untuk mempercepat pemuatan gambar dari server komik CDN.

### 3. 📊 Profil Pengguna & Statistik Watchlist (Supabase)
*   Dashboard visual yang memukau dengan statistik nonton:
    *   *Total Waktu Menonton* (dalam menit/hari).
    *   *Rata-rata Skor Bintang* yang diberikan.
    *   *Total Episode* yang diselesaikan.
*   Daftar tontonan pribadi (Watchlist) yang tersinkronisasi aman dengan basis data Supabase.

### 4. 📴 Progressive Web App (PWA) & Offline Mode
*   Bisa diinstal langsung di HP (Android/iOS) atau PC layaknya aplikasi native.
*   Mendukung caching Service Worker kustom.
*   Halaman offline yang cantik (`<WifiOff />`) untuk memberi tahu pengguna jika jaringan internet terputus.

---

## 🚀 Teknologi yang Digunakan

*   **Framework Utama:** [Next.js 16 (Turbopack)](https://nextjs.org/) dengan App Router.
*   **Library UI/UX:** [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), dan [Lucide React](https://lucide.dev/) untuk visual yang modern dan premium.
*   **Database & Autentikasi:** [Supabase](https://supabase.com/) (Postgres DB, GoTrue Auth, Realtime).
*   **State Management & Querying:** [Zustand](https://zustand-demo.pmnd.rs/) & [@tanstack/react-query v5](https://tanstack.com/query/latest).
*   **Grafik Statistik:** [Recharts](https://recharts.org/) untuk visualisasi data watchlist.
*   **Data Anime:** [AniList GraphQL API](https://anilist.gitbook.io/anilist-apiv2-docs/).
*   **Data Streaming & Manga:** Sanka Vollerei API (`sankavollerei.web.id`).

---

## 🛠️ Cara Instalasi & Menjalankan Proyek

### 1. Prasyarat
Pastikan kamu sudah menginstal Node.js versi terbaru (direkomendasikan v18+).

### 2. Kloning Proyek
```bash
git clone <url-repositori-github-kamu>
cd aniverse
```

### 3. Instal Dependensi
```bash
npm install --legacy-peer-deps
```

### 4. Konfigurasi Environment Variables (`.env.local`)
Buat file bernama `.env.local` di root folder proyek dan tambahkan konfigurasi berikut:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 5. Jalankan Server Pengembangan (Local Dev)
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser untuk menjelajahi aplikasi.

### 6. Build Produksi
```bash
npm run build
npm run start
```

---

## 📂 Struktur Direktori

```
aniverse/
├── public/                # File statis, manifest PWA, & icon set
├── src/
│   ├── app/               # Rute halaman Next.js (App Router)
│   │   ├── anime/         # Halaman Detail Anime & Player
│   │   ├── manga/         # Halaman Detail Manga & Chapter Reader
│   │   ├── profile/       # Dashboard Profil & Statistik
│   │   ├── offline/       # Halaman fallback mode Offline
│   │   └── api/           # Endpoint API Server-side Proxy
│   ├── components/        # Komponen UI responsif (layout, anime, ui)
│   ├── lib/               # Utility, Supabase Client, & API integrations
│   └── types/             # Deklarasi tipe data TypeScript
├── eslint.config.mjs      # Konfigurasi ESLint Flat Config
├── next.config.ts         # Konfigurasi Next.js
└── tsconfig.json          # Konfigurasi TypeScript
```
