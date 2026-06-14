import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Baca Manga, Manhwa & Manhua Sub Indo Gratis",
  description:
    "Nikmati ribuan judul komik Jepang (Manga), Korea (Manhwa), dan Mandarin (Manhua) terjemahan Bahasa Indonesia gratis. Update chapter terbaru setiap hari.",
  keywords: [
    "baca manga",
    "baca manhwa",
    "baca manhua",
    "manga sub indo",
    "manhwa indonesia",
    "komik online gratis",
    "komikindo",
  ],
  alternates: {
    canonical: "/manga",
  },
  openGraph: {
    title: "Baca Manga, Manhwa & Manhua Sub Indo — AniVerse",
    description:
      "Nikmati ribuan judul komik Jepang (Manga), Korea (Manhwa), dan Mandarin (Manhua) terjemahan Bahasa Indonesia gratis. Update harian.",
    url: "/manga",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Baca Manga, Manhwa & Manhua Sub Indo — AniVerse",
    description:
      "Nikmati ribuan judul komik Jepang (Manga), Korea (Manhwa), dan Mandarin (Manhua) terjemahan Bahasa Indonesia gratis. Update harian.",
  },
};

export default function MangaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
