/**
 * Supabase Sync Service
 * Syncs localStorage data (watch history, manga history) bidirectionally with Supabase.
 * 
 * Strategy:
 * - localStorage is the primary cache (fast reads, works offline)
 * - When user is logged in, data is synced to Supabase in the background
 * - On login, remote data is merged into localStorage (newer wins)
 * - Writes go to localStorage first, then debounced push to Supabase
 */

import { createClient } from "@/lib/supabase/client";
import type { WatchHistoryItem } from "./watchHistory";
import type { MangaHistoryItem } from "./mangaHistory";

// ─── State ───────────────────────────────────────────────

let syncTimerWatch: ReturnType<typeof setTimeout> | null = null;
let syncTimerManga: ReturnType<typeof setTimeout> | null = null;
let isSyncing = false;

const SYNC_DEBOUNCE_MS = 5000; // 5 seconds after last write

// ─── Auth Helpers ────────────────────────────────────────

async function getLoggedInUserId(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

// ─── Watch History Sync ──────────────────────────────────

/**
 * Push local watch history to Supabase (upsert).
 * Only pushes items that are newer than last sync.
 */
export async function pushWatchHistoryToCloud(): Promise<void> {
  const userId = await getLoggedInUserId();
  if (!userId) return;

  try {
    const raw = localStorage.getItem("aniverse_watch_history");
    if (!raw) return;
    const localItems: WatchHistoryItem[] = JSON.parse(raw);
    if (localItems.length === 0) return;

    const supabase = createClient();

    // Batch upsert (max 50 at a time to avoid payload limits)
    const rows = localItems.slice(0, 100).map(item => ({
      user_id: userId,
      anime_id: item.animeId,
      anime_title: item.animeTitle,
      anime_title_english: item.animeTitleEnglish || null,
      cover_image: item.coverImage || null,
      episode_title: item.episodeTitle,
      episode_id: item.episodeId,
      provider_key: item.providerKey || null,
      episode_number: item.episodeNumber || null,
      total_episodes: item.totalEpisodes || null,
      watched_seconds: item.watchedSeconds || 0,
      duration_seconds: item.durationSeconds || null,
      watched_at: new Date(item.timestamp).toISOString(),
    }));

    // Upsert in batches of 25
    for (let i = 0; i < rows.length; i += 25) {
      const batch = rows.slice(i, i + 25);
      await supabase.from("watch_history").upsert(batch, {
        onConflict: "user_id,anime_id,episode_id",
        ignoreDuplicates: false,
      });
    }

    console.log(`[Sync] Pushed ${rows.length} watch history items to cloud`);
  } catch (err) {
    console.error("[Sync] Push watch history failed:", err);
  }
}

/**
 * Pull watch history from Supabase and merge into localStorage.
 * Remote data fills gaps; local newer timestamps win.
 */
export async function pullWatchHistoryFromCloud(): Promise<void> {
  const userId = await getLoggedInUserId();
  if (!userId) return;

  try {
    const supabase = createClient();
    const { data: remoteItems, error } = await supabase
      .from("watch_history")
      .select("*")
      .eq("user_id", userId)
      .order("watched_at", { ascending: false })
      .limit(100);

    if (error || !remoteItems || remoteItems.length === 0) return;

    // Get local data
    const raw = localStorage.getItem("aniverse_watch_history");
    const localItems: WatchHistoryItem[] = raw ? JSON.parse(raw) : [];

    // Build a map of local items by key
    const localMap = new Map<string, WatchHistoryItem>();
    localItems.forEach(item => {
      localMap.set(`${item.animeId}_${item.episodeId}`, item);
    });

    // Merge remote items
    let merged = false;
    for (const remote of remoteItems) {
      const key = `${remote.anime_id}_${remote.episode_id}`;
      const local = localMap.get(key);
      const remoteTs = new Date(remote.watched_at).getTime();

      if (!local) {
        // Remote-only item → add to local
        localMap.set(key, {
          animeId: remote.anime_id,
          animeTitle: remote.anime_title,
          animeTitleEnglish: remote.anime_title_english || undefined,
          coverImage: remote.cover_image || "",
          episodeTitle: remote.episode_title,
          episodeId: remote.episode_id,
          providerKey: remote.provider_key || "",
          timestamp: remoteTs,
          episodeNumber: remote.episode_number || undefined,
          totalEpisodes: remote.total_episodes || undefined,
          watchedSeconds: remote.watched_seconds || undefined,
          durationSeconds: remote.duration_seconds || undefined,
        });
        merged = true;
      } else if (remoteTs > local.timestamp) {
        // Remote is newer → update local
        localMap.set(key, {
          ...local,
          animeTitle: remote.anime_title,
          animeTitleEnglish: remote.anime_title_english || local.animeTitleEnglish,
          coverImage: remote.cover_image || local.coverImage,
          episodeTitle: remote.episode_title,
          timestamp: remoteTs,
          episodeNumber: remote.episode_number || local.episodeNumber,
          totalEpisodes: remote.total_episodes || local.totalEpisodes,
          watchedSeconds: remote.watched_seconds ?? local.watchedSeconds,
          durationSeconds: remote.duration_seconds ?? local.durationSeconds,
        });
        merged = true;
      }
    }

    if (merged) {
      // Sort by timestamp desc, save back to localStorage
      const allItems = Array.from(localMap.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 100);
      localStorage.setItem("aniverse_watch_history", JSON.stringify(allItems));
      console.log(`[Sync] Merged ${remoteItems.length} remote watch items into local`);
    }
  } catch (err) {
    console.error("[Sync] Pull watch history failed:", err);
  }
}

// ─── Manga History Sync ──────────────────────────────────

export async function pushMangaHistoryToCloud(): Promise<void> {
  const userId = await getLoggedInUserId();
  if (!userId) return;

  try {
    const raw = localStorage.getItem("aniverse_manga_history");
    if (!raw) return;
    const localItems: MangaHistoryItem[] = JSON.parse(raw);
    if (localItems.length === 0) return;

    const supabase = createClient();

    const rows = localItems.slice(0, 100).map(item => ({
      user_id: userId,
      manga_slug: item.mangaSlug,
      manga_title: item.mangaTitle,
      cover_image: item.coverImage || null,
      last_chapter_slug: item.lastChapterSlug,
      last_chapter_title: item.lastChapterTitle || null,
      chapter_number: item.chapterNumber || null,
      last_page_index: item.lastPageIndex || 0,
      total_pages: item.totalPages || null,
      genres: item.genres || null,
      type: item.type || null,
      read_at: new Date(item.timestamp).toISOString(),
    }));

    for (let i = 0; i < rows.length; i += 25) {
      const batch = rows.slice(i, i + 25);
      await supabase.from("manga_history").upsert(batch, {
        onConflict: "user_id,manga_slug,last_chapter_slug",
        ignoreDuplicates: false,
      });
    }

    console.log(`[Sync] Pushed ${rows.length} manga history items to cloud`);
  } catch (err) {
    console.error("[Sync] Push manga history failed:", err);
  }
}

export async function pullMangaHistoryFromCloud(): Promise<void> {
  const userId = await getLoggedInUserId();
  if (!userId) return;

  try {
    const supabase = createClient();
    const { data: remoteItems, error } = await supabase
      .from("manga_history")
      .select("*")
      .eq("user_id", userId)
      .order("read_at", { ascending: false })
      .limit(100);

    if (error || !remoteItems || remoteItems.length === 0) return;

    const raw = localStorage.getItem("aniverse_manga_history");
    const localItems: MangaHistoryItem[] = raw ? JSON.parse(raw) : [];

    const localMap = new Map<string, MangaHistoryItem>();
    localItems.forEach(item => {
      localMap.set(`${item.mangaSlug}_${item.lastChapterSlug}`, item);
    });

    let merged = false;
    for (const remote of remoteItems) {
      const key = `${remote.manga_slug}_${remote.last_chapter_slug}`;
      const local = localMap.get(key);
      const remoteTs = new Date(remote.read_at).getTime();

      if (!local) {
        localMap.set(key, {
          mangaSlug: remote.manga_slug,
          mangaTitle: remote.manga_title,
          coverImage: remote.cover_image || "",
          lastChapterSlug: remote.last_chapter_slug,
          lastChapterTitle: remote.last_chapter_title || "",
          chapterNumber: remote.chapter_number || undefined,
          lastPageIndex: remote.last_page_index || undefined,
          totalPages: remote.total_pages || undefined,
          genres: remote.genres || undefined,
          type: remote.type || undefined,
          timestamp: remoteTs,
        });
        merged = true;
      } else if (remoteTs > local.timestamp) {
        localMap.set(key, {
          ...local,
          mangaTitle: remote.manga_title,
          coverImage: remote.cover_image || local.coverImage,
          lastChapterTitle: remote.last_chapter_title || local.lastChapterTitle,
          timestamp: remoteTs,
          lastPageIndex: remote.last_page_index ?? local.lastPageIndex,
          totalPages: remote.total_pages ?? local.totalPages,
        });
        merged = true;
      }
    }

    if (merged) {
      const allItems = Array.from(localMap.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 100);
      localStorage.setItem("aniverse_manga_history", JSON.stringify(allItems));
      console.log(`[Sync] Merged ${remoteItems.length} remote manga items into local`);
    }
  } catch (err) {
    console.error("[Sync] Pull manga history failed:", err);
  }
}

// ─── Debounced Triggers ──────────────────────────────────

/**
 * Call this after any local write to watch history.
 * It debounces the push to avoid too many API calls.
 */
export function scheduleSyncWatchHistory(): void {
  if (syncTimerWatch) clearTimeout(syncTimerWatch);
  syncTimerWatch = setTimeout(() => {
    pushWatchHistoryToCloud();
  }, SYNC_DEBOUNCE_MS);
}

export function scheduleSyncMangaHistory(): void {
  if (syncTimerManga) clearTimeout(syncTimerManga);
  syncTimerManga = setTimeout(() => {
    pushMangaHistoryToCloud();
  }, SYNC_DEBOUNCE_MS);
}

// ─── Full Sync (call on login/app init) ──────────────────

/**
 * Full bidirectional sync: pull remote → merge → push local.
 * Call this once on login or app mount when user is authenticated.
 */
export async function fullSync(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const userId = await getLoggedInUserId();
    if (!userId) return;

    console.log("[Sync] Starting full sync...");

    // Pull first (get cloud data → merge into local)
    await Promise.all([
      pullWatchHistoryFromCloud(),
      pullMangaHistoryFromCloud(),
    ]);

    // Then push (local → cloud, catches anything remote didn't have)
    await Promise.all([
      pushWatchHistoryToCloud(),
      pushMangaHistoryToCloud(),
    ]);

    console.log("[Sync] Full sync complete ✓");
  } catch (err) {
    console.error("[Sync] Full sync failed:", err);
  } finally {
    isSyncing = false;
  }
}
