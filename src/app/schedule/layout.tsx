import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jadwal Rilis Anime Terlengkap — Hari Ini & Mingguan",
  description:
    "Pantau jadwal rilis anime sub Indo terlengkap secara real-time setiap hari. Dapatkan informasi jam tayang episode terbaru untuk anime musim ini.",
  keywords: [
    "jadwal anime",
    "jadwal rilis anime",
    "jadwal tayang anime",
    "anime hari ini",
    "jadwal anime mingguan",
    "anime airing schedule",
  ],
  alternates: {
    canonical: "/schedule",
  },
  openGraph: {
    title: "Jadwal Rilis Anime Terlengkap — AniVerse",
    description:
      "Pantau jadwal rilis anime sub Indo terlengkap secara real-time setiap hari. Jam tayang episode baru anime musim ini.",
    url: "/schedule",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jadwal Rilis Anime Terlengkap — AniVerse",
    description:
      "Pantau jadwal rilis anime sub Indo terlengkap secara real-time setiap hari. Jam tayang episode baru anime musim ini.",
  },
};

export default function ScheduleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
