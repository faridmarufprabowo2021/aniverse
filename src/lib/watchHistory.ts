/**
 * Watch Progress & History Manager
 * Uses localStorage for guests, and can sync with Supabase when user is logged in.
 */

import { scheduleSyncWatchHistory } from "./syncService";

export interface WatchHistoryItem {
  animeId: number;
  animeTitle: string;
  animeTitleEnglish?: string;
  coverImage: string;
  episodeTitle: string;
  episodeId: string;
  providerKey: string;
  timestamp: number; // unix ms when last watched
  episodeNumber?: number;     // Episode ke berapa
  totalEpisodes?: number;     // Total episode anime
  watchedSeconds?: number;    // Posisi terakhir nonton (detik)
  durationSeconds?: number;   // Durasi total video (detik)
}

const HISTORY_KEY = "aniverse_watch_history";
const MAX_HISTORY = 100;

// ─── Read all history ────────────────────────────
export function getWatchHistory(): WatchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Add or update a history entry ───────────────
export function addToWatchHistory(item: Omit<WatchHistoryItem, "timestamp">): void {
  if (typeof window === "undefined") return;
  try {
    const history = getWatchHistory();

    // Remove existing entry for same anime+episode
    const filtered = history.filter(
      h => !(h.animeId === item.animeId && h.episodeId === item.episodeId)
    );

    // Add to front
    filtered.unshift({ ...item, timestamp: Date.now() });

    // Keep max items
    const trimmed = filtered.slice(0, MAX_HISTORY);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    scheduleSyncWatchHistory();
  } catch {
    // localStorage full or unavailable
  }
}

// ─── Update watch progress (position) ────────────
export function updateWatchProgress(
  animeId: number,
  episodeId: string,
  watchedSeconds: number,
  durationSeconds?: number
): void {
  if (typeof window === "undefined") return;
  try {
    const history = getWatchHistory();
    const idx = history.findIndex(
      h => h.animeId === animeId && h.episodeId === episodeId
    );
    if (idx !== -1) {
      history[idx].watchedSeconds = Math.floor(watchedSeconds);
      if (durationSeconds) history[idx].durationSeconds = Math.floor(durationSeconds);
      history[idx].timestamp = Date.now();
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      scheduleSyncWatchHistory();
    }
  } catch {
    // ignore
  }
}

// ─── Remove a specific entry ─────────────────────
export function removeFromHistory(animeId: number, episodeId: string): void {
  if (typeof window === "undefined") return;
  try {
    const history = getWatchHistory();
    const filtered = history.filter(
      h => !(h.animeId === animeId && h.episodeId === episodeId)
    );
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    scheduleSyncWatchHistory();
  } catch {
    // ignore
  }
}

// ─── Clear all history ───────────────────────────
export function clearWatchHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
  scheduleSyncWatchHistory();
}

// ─── Get last watched for a specific anime ───────
export function getLastWatchedEpisode(animeId: number): WatchHistoryItem | null {
  const history = getWatchHistory();
  return history.find(h => h.animeId === animeId) || null;
}

// ─── Get unique anime count ──────────────────────
export function getUniqueAnimeCount(): number {
  const history = getWatchHistory();
  return new Set(history.map(h => h.animeId)).size;
}

// ─── Format seconds to MM:SS ─────────────────────
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Get watch progress percentage ───────────────
export function getWatchProgress(item: WatchHistoryItem): number {
  if (!item.watchedSeconds || !item.durationSeconds) return 0;
  return Math.min(100, Math.round((item.watchedSeconds / item.durationSeconds) * 100));
}
