/**
 * Manga Reading History Manager
 * Tracks which manga chapters a user has read, stored in localStorage.
 */

import { scheduleSyncMangaHistory } from "./syncService";

export interface MangaHistoryItem {
  mangaSlug: string;
  mangaTitle: string;
  coverImage: string;
  lastChapterSlug: string;
  lastChapterTitle: string;
  chapterNumber?: number;
  lastPageIndex?: number;
  totalPages?: number;
  timestamp: number;
  genres?: string[];
  type?: string; // Manga, Manhwa, Manhua
}

const MANGA_HISTORY_KEY = "aniverse_manga_history";
const MAX_MANGA_HISTORY = 100;

// ─── Read all manga history ─────────────────────
export function getMangaHistory(): MangaHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MANGA_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Add or update a manga history entry ────────
export function addToMangaHistory(item: Omit<MangaHistoryItem, "timestamp">): void {
  if (typeof window === "undefined") return;
  try {
    const history = getMangaHistory();

    // Remove existing entry for same manga+chapter
    const filtered = history.filter(
      h => !(h.mangaSlug === item.mangaSlug && h.lastChapterSlug === item.lastChapterSlug)
    );

    // Also update the "latest" entry for this manga (keep only latest chapter per manga at top)
    const otherManga = filtered.filter(h => h.mangaSlug !== item.mangaSlug);
    const sameManga = filtered.filter(h => h.mangaSlug === item.mangaSlug);

    // Add new entry at front, then keep older chapters of same manga
    const result = [
      { ...item, timestamp: Date.now() },
      ...sameManga,
      ...otherManga,
    ].slice(0, MAX_MANGA_HISTORY);

    localStorage.setItem(MANGA_HISTORY_KEY, JSON.stringify(result));
    scheduleSyncMangaHistory();
  } catch {
    // localStorage full or unavailable
  }
}

// ─── Get last read chapter for a manga ──────────
export function getLastReadChapter(mangaSlug: string): MangaHistoryItem | null {
  const history = getMangaHistory();
  return history.find(h => h.mangaSlug === mangaSlug) || null;
}

// ─── Get all chapters read for a manga ──────────
export function getReadChapters(mangaSlug: string): MangaHistoryItem[] {
  return getMangaHistory().filter(h => h.mangaSlug === mangaSlug);
}

// ─── Check if a chapter has been read ───────────
export function isChapterRead(mangaSlug: string, chapterSlug: string): boolean {
  return getMangaHistory().some(
    h => h.mangaSlug === mangaSlug && h.lastChapterSlug === chapterSlug
  );
}

// ─── Remove a specific entry ────────────────────
export function removeFromMangaHistory(mangaSlug: string, chapterSlug: string): void {
  if (typeof window === "undefined") return;
  try {
    const history = getMangaHistory();
    const filtered = history.filter(
      h => !(h.mangaSlug === mangaSlug && h.lastChapterSlug === chapterSlug)
    );
    localStorage.setItem(MANGA_HISTORY_KEY, JSON.stringify(filtered));
    scheduleSyncMangaHistory();
  } catch {
    // ignore
  }
}

// ─── Remove all history for a manga ─────────────
export function removeMangaFromHistory(mangaSlug: string): void {
  if (typeof window === "undefined") return;
  try {
    const history = getMangaHistory();
    const filtered = history.filter(h => h.mangaSlug !== mangaSlug);
    localStorage.setItem(MANGA_HISTORY_KEY, JSON.stringify(filtered));
    scheduleSyncMangaHistory();
  } catch {
    // ignore
  }
}

// ─── Clear all manga history ────────────────────
export function clearMangaHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MANGA_HISTORY_KEY);
  scheduleSyncMangaHistory();
}

// ─── Get unique manga count ─────────────────────
export function getUniqueMangaCount(): number {
  const history = getMangaHistory();
  return new Set(history.map(h => h.mangaSlug)).size;
}

// ─── Get grouped manga history (latest chapter per manga) ─
export function getGroupedMangaHistory(): MangaHistoryItem[] {
  const history = getMangaHistory();
  const seen = new Set<string>();
  return history.filter(h => {
    if (seen.has(h.mangaSlug)) return false;
    seen.add(h.mangaSlug);
    return true;
  });
}
