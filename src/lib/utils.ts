import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format score from 0-100 to 0-10 (1 decimal)
export function formatScore(score: number | undefined): string {
  if (score == null) return "N/A";
  return score.toFixed(1);
}

// Get score color based on value (0-10)
export function getScoreColor(score: number | undefined): string {
  if (score == null) return "var(--color-text-muted)";
  if (score >= 8) return "var(--score-10)";
  if (score >= 6) return "var(--score-8)";
  if (score >= 4) return "var(--score-6)";
  if (score >= 2) return "var(--score-4)";
  return "var(--score-2)";
}

// Format large numbers (1000 → 1K, 1000000 → 1M)
export function formatNumber(n: number | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// Format anime status (Bahasa Indonesia)
export function formatStatus(status: string): string {
  const map: Record<string, string> = {
    RELEASING: "Sedang Tayang",
    FINISHED: "Selesai",
    NOT_YET_RELEASED: "Belum Tayang",
    CANCELLED: "Dibatalkan",
    HIATUS: "Hiatus",
  };
  return map[status] ?? status;
}

// Format anime format
export function formatAnimeType(format: string): string {
  const map: Record<string, string> = {
    TV: "Serial TV",
    TV_SHORT: "TV Pendek",
    MOVIE: "Film",
    SPECIAL: "Spesial",
    OVA: "OVA",
    ONA: "ONA",
    MUSIC: "Musik",
  };
  return map[format] ?? format;
}

// Format musim tayang
export function formatSeason(season: string, year?: number): string {
  const map: Record<string, string> = {
    WINTER: "Musim Dingin",
    SPRING: "Musim Semi",
    SUMMER: "Musim Panas",
    FALL: "Musim Gugur",
  };
  const s = map[season] ?? season;
  return year ? `${s} ${year}` : s;
}

// Format durasi episode
export function formatDuration(minutes: number | undefined): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} menit`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} jam ${m} mnt` : `${h} jam`;
}

// Format tanggal tayang
export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
}

// Hitung mundur episode berikutnya
export function formatCountdown(secondsUntilAiring: number): string {
  if (secondsUntilAiring <= 0) return "Sedang tayang";
  const d = Math.floor(secondsUntilAiring / 86400);
  const h = Math.floor((secondsUntilAiring % 86400) / 3600);
  const m = Math.floor((secondsUntilAiring % 3600) / 60);

  if (d > 0) return `${d}h ${h}j`;
  if (h > 0) return `${h}j ${m}m`;
  return `${m}m`;
}

// Debounce utility
export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

// Truncate text to N chars
export function truncate(text: string, chars: number): string {
  if (text.length <= chars) return text;
  return `${text.slice(0, chars).trim()}…`;
}

// Ambil judul terbaik (prioritaskan romaji untuk konsistensi)
export function getBestTitle(title: { romaji?: string; english?: string | null; native?: string | null }): string {
  return title.romaji || title.english || title.native || "Tidak Diketahui";
}

// Ambil URL cover image terbaik
export function getCoverImage(
  coverImage?: { extraLarge?: string; large?: string; medium?: string }
): string {
  return coverImage?.extraLarge ?? coverImage?.large ?? coverImage?.medium ?? "/placeholder.jpg";
}

// Format sumber material
export function formatSource(source: string | undefined): string {
  if (!source) return "—";
  const map: Record<string, string> = {
    MANGA: "Manga",
    LIGHT_NOVEL: "Light Novel",
    VISUAL_NOVEL: "Visual Novel",
    VIDEO_GAME: "Gim Video",
    ORIGINAL: "Original",
    OTHER: "Lainnya",
    NOVEL: "Novel",
    DOUJINSHI: "Doujinshi",
    ANIME: "Anime",
  };
  return map[source] ?? source;
}

// Genre → gradient color map (for genre pills)
const GENRE_COLORS: Record<string, string> = {
  Action:      "#FF6384",
  Adventure:   "#FF9F40",
  Comedy:      "#FFCD56",
  Drama:       "#6C63FF",
  Fantasy:     "#7C4DFF",
  Horror:      "#FF5C7A",
  Mystery:     "#4BC0C0",
  Romance:     "#FF6384",
  "Sci-Fi":    "#36A2EB",
  "Slice of Life": "#00D4AA",
  Sports:      "#FF9F40",
  Supernatural:"#9C27B0",
  Thriller:    "#FF5C7A",
  Mecha:       "#607D8B",
  Music:       "#E91E63",
  Psychological: "#673AB7",
  Ecchi:       "#FF6384",
  Isekai:      "#7C4DFF",
  Shounen:     "#FF9F40",
  Shoujo:      "#FF6384",
  Seinen:      "#4BC0C0",
  Josei:       "#E91E63",
};

export function getGenreColor(genre: string): string {
  return GENRE_COLORS[genre] ?? "#A0A0C0";
}
