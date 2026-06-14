import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cari Anime & Manga Sub Indo Lengkap — Filter Genre & Tahun",
  description:
    "Cari anime dan manga sub Indo favoritmu secara instan. Filter berdasarkan genre, tahun rilis, format (TV, Movie, OVA), status, dan urutkan sesuai trending.",
  keywords: [
    "cari anime",
    "cari manga",
    "search anime sub indo",
    "filter genre anime",
    "database anime indonesia",
    "pencarian anime",
  ],
  alternates: {
    canonical: "/search",
  },
  openGraph: {
    title: "Pencarian Anime & Manga Terlengkap — AniVerse",
    description:
      "Cari anime dan manga sub Indo favoritmu secara instan. Filter berdasarkan genre, tahun rilis, format, dan status.",
    url: "/search",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pencarian Anime & Manga Terlengkap — AniVerse",
    description:
      "Cari anime dan manga sub Indo favoritmu secara instan. Filter berdasarkan genre, tahun rilis, format, dan status.",
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
