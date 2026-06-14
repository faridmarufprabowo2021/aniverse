import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tentang Kami — Platform Tracker Anime & Manga Indonesia",
  description:
    "Pelajari lebih lanjut tentang AniVerse, platform tracking dan streaming anime/manga terbaik di Indonesia. Dilengkapi data real-time dari AniList, 5+ provider streaming, dan notifikasi episode baru.",
  keywords: [
    "tentang aniverse",
    "tracker anime indonesia",
    "detail aniverse",
    "developer aniverse",
    "fitur aniverse",
  ],
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "Tentang Kami — AniVerse",
    description:
      "Pelajari lebih lanjut tentang AniVerse, platform tracking dan streaming anime/manga terbaik di Indonesia.",
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tentang Kami — AniVerse",
    description:
      "Pelajari lebih lanjut tentang AniVerse, platform tracking dan streaming anime/manga terbaik di Indonesia.",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
