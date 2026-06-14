import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar Anime Musiman (Seasonal) Terbaru & Terpopuler",
  description:
    "Temukan daftar anime musiman terbaru (Winter, Spring, Summer, Fall). Lihat statistik popularitas, rating, genre, dan studio pembuat anime kesukaanmu.",
  keywords: [
    "anime seasonal",
    "anime musiman",
    "anime winter",
    "anime spring",
    "anime summer",
    "anime fall",
    "anime terbaru",
  ],
  alternates: {
    canonical: "/seasonal",
  },
  openGraph: {
    title: "Daftar Anime Musiman (Seasonal) Terbaru — AniVerse",
    description:
      "Temukan daftar anime musiman terbaru (Winter, Spring, Summer, Fall). Statistik popularitas, rating, dan info lengkap.",
    url: "/seasonal",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Daftar Anime Musiman (Seasonal) Terbaru — AniVerse",
    description:
      "Temukan daftar anime musiman terbaru (Winter, Spring, Summer, Fall). Statistik popularitas, rating, dan info lengkap.",
  },
};

export default function SeasonalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
