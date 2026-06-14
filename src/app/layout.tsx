import type { Metadata, Viewport } from "next";
import { Inter, Outfit, Noto_Sans_JP } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { InstallPrompt } from "@/components/ui/InstallPrompt";
import { Providers } from "@/components/Providers";
import { AIChatWidget } from "@/components/ai/AIChatWidget";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-jp",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "AniVerse — Tracker Anime Indonesia",
    template: "%s | AniVerse",
  },
  description:
    "Temukan, lacak, dan eksplorasi anime favoritmu. AniVerse adalah teman anime terbaikmu dengan data real-time, rekomendasi personal, dan fitur komunitas.",
  keywords: ["anime", "manga", "daftar anime", "anilist", "myanimelist", "anime musiman", "tracker anime"],
  authors: [{ name: "AniVerse" }],
  creator: "AniVerse",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "AniVerse",
    title: "AniVerse — Tracker Anime Indonesia",
    description: "Temukan, lacak, dan eksplorasi anime favoritmu di AniVerse.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AniVerse — Tracker Anime Indonesia",
    description: "Temukan, lacak, dan eksplorasi anime favoritmu di AniVerse.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AniVerse",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#7C3AED",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${outfit.variable} ${notoSansJP.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col">
        {/* Theme init script - runs before React hydrates to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t = localStorage.getItem('aniverse-theme');
              var r = document.documentElement;
              if (t === 'amoled') {
                r.style.setProperty('--color-bg','#000000');
                r.style.setProperty('--color-surface','#050505');
                r.style.setProperty('--color-surface-2','#0d0d0d');
                r.style.setProperty('--color-surface-3','#151515');
                r.style.setProperty('--color-border','#1a1a1a');
              } else if (t === 'light') {
                r.style.setProperty('--color-bg','#f4f4f8');
                r.style.setProperty('--color-surface','#ffffff');
                r.style.setProperty('--color-surface-2','#f0f0f4');
                r.style.setProperty('--color-surface-3','#e4e4ec');
                r.style.setProperty('--color-border','#d0d0dc');
                r.style.setProperty('--color-border-hover','#b0b0c0');
                r.style.setProperty('--color-text-primary','#0f0f1a');
                r.style.setProperty('--color-text-secondary','#3a3a50');
                r.style.setProperty('--color-text-muted','#7a7a90');
                r.style.setProperty('--color-text-inverse','#f0f0ff');
              }
            } catch(e) {}
          })();
        `}} />
        <Providers>
          <div className="flex min-h-dvh flex-col md:flex-row">
            <DesktopSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              {children}
            </div>
          </div>
          <AIChatWidget />
          <InstallPrompt />
          <ServiceWorkerRegistration />
        </Providers>
      </body>
    </html>
  );
}
