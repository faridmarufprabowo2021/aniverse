"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type WatchlistStatus = "WATCHING" | "COMPLETED" | "ON_HOLD" | "DROPPED" | "PLAN_TO_WATCH";

export async function upsertWatchlistEntry(data: {
  animeId: number;
  titleRomaji: string;
  coverImage?: string;
  status: WatchlistStatus;
  progress: number;
  score?: number;
  notes?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to add to your list." };
  }

  // 1. Ensure anime_cache exists for Foreign Key constraint
  const { error: cacheError } = await supabase
    .from("anime_cache")
    .upsert(
      {
        id: data.animeId,
        title_romaji: data.titleRomaji,
        cover_image_url: data.coverImage,
      },
      { onConflict: "id" }
    );

  if (cacheError) {
    console.error("Failed to upsert anime_cache:", cacheError);
    return { error: "Failed to sync anime data." };
  }

  // 2. Upsert to user_anime_list
  const { error: listError } = await supabase
    .from("user_anime_list")
    .upsert(
      {
        user_id: user.id,
        anime_id: data.animeId,
        status: data.status,
        progress: data.progress,
        score: data.score || null,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,anime_id" } // Wait, does this conflict target exist?
    );

  if (listError) {
    console.error("Failed to upsert user_anime_list:", listError);
    return { error: "Failed to update your list." };
  }

  revalidatePath("/mylist");
  revalidatePath(`/anime/${data.animeId}`);

  return { success: true };
}

export async function deleteWatchlistEntry(animeId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("user_anime_list")
    .delete()
    .eq("user_id", user.id)
    .eq("anime_id", animeId);

  if (error) return { error: "Failed to remove entry from list." };

  revalidatePath("/mylist");
  revalidatePath(`/anime/${animeId}`);

  return { success: true };
}
