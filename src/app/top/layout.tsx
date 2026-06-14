import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Peringkat Anime Terpopuler & Rating Tertinggi Sepanjang Masa",
  description:
    "Lihat daftar anime dengan rating tertinggi dan paling populer sepanjang masa berdasarkan data tracker global. Temukan anime mahakarya terbaik untuk ditonton.",
  keywords: [
    "anime terpopuler",
    "anime rating tertinggi",
    "anime terbaik sepanjang masa",
    "top anime list",
    "anime favorit",
    "peringkat anime",
  ],
  alternates: {
    canonical: "/top",
  },
  openGraph: {
    title: "Peringkat Anime Terpopuler & Rating Tertinggi — AniVerse",
    description:
      "Daftar anime dengan rating tertinggi dan paling populer sepanjang masa berdasarkan data tracker global.",
    url: "/top",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Peringkat Anime Terpopuler & Rating Tertinggi — AniVerse",
    description:
      "Daftar anime dengan rating tertinggi dan paling populer sepanjang masa berdasarkan data tracker global.",
  },
};

export default function TopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
