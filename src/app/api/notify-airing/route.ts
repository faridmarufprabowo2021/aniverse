import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';

// AniList GraphQL query for currently airing anime
const AIRING_QUERY = `
query AiringSchedule($page: Int) {
  Page(page: $page, perPage: 50) {
    airingSchedules(
      airingAt_greater: 0
      airingAt_lesser: 0
      sort: TIME_DESC
    ) {
      id
      airingAt
      episode
      media {
        id
        title { romaji english }
        coverImage { medium }
        siteUrl
      }
    }
  }
}
`;

// Fetch anime that aired in the last 24 hours from AniList
async function fetchRecentlyAired(): Promise<Array<{
  mediaId: number;
  title: string;
  episode: number;
  coverImage: string;
}>> {
  const now = Math.floor(Date.now() / 1000);
  const past24h = now - 86400;

  const query = `
  query {
    Page(perPage: 50) {
      airingSchedules(
        airingAt_greater: ${past24h}
        airingAt_lesser: ${now}
        sort: TIME_DESC
      ) {
        episode
        media {
          id
          title { romaji english }
          coverImage { medium }
        }
      }
    }
  }`;

  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const schedules = json.data?.Page?.airingSchedules || [];
    return schedules.map((s: any) => ({
      mediaId: s.media.id,
      title: s.media.title.english || s.media.title.romaji,
      episode: s.episode,
      coverImage: s.media.coverImage?.medium || '',
    }));
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  // Validate secret header (for cron security)
  const authHeader = request.headers.get('x-cron-secret');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // 1. Get recently aired episodes
  const recentlyAired = await fetchRecentlyAired();
  if (recentlyAired.length === 0) {
    return NextResponse.json({ message: 'No recent airings found', notified: 0 });
  }

  const mediaIds = recentlyAired.map(a => a.mediaId);

  // 2. Find users who are watching these anime
  const { data: watchingEntries } = await supabase
    .from('user_anime_list')
    .select('user_id, anime_id')
    .in('anime_id', mediaIds)
    .eq('status', 'WATCHING');

  if (!watchingEntries || watchingEntries.length === 0) {
    return NextResponse.json({ message: 'No watching users found', notified: 0 });
  }

  const userIds = [...new Set(watchingEntries.map(e => e.user_id))];

  // 3. Get their push subscriptions
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('user_id, subscription_data')
    .in('user_id', userIds)
    .eq('is_active', true);

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ message: 'No active push subscriptions', notified: 0 });
  }

  // 4. Setup VAPID
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 });
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@aniverse.app',
    vapidPublicKey,
    vapidPrivateKey
  );

  // 5. Send notifications
  let notified = 0;
  for (const sub of subscriptions) {
    const userAnime = watchingEntries.filter(e => e.user_id === sub.user_id);
    const animesToNotify = recentlyAired.filter(a =>
      userAnime.some(e => e.anime_id === a.mediaId)
    );
    for (const anime of animesToNotify) {
      try {
        await webpush.sendNotification(
          sub.subscription_data as webpush.PushSubscription,
          JSON.stringify({
            title: `🎬 ${anime.title}`,
            body: `Episode ${anime.episode} sudah tayang!`,
            url: `/anime/${anime.mediaId}`,
            icon: anime.coverImage,
          })
        );
        // Also insert into notifications table (in-app)
        await supabase.from('notifications').insert({
          user_id: sub.user_id,
          type: 'new_episode',
          payload: {
            anime_id: anime.mediaId,
            title: anime.title,
            episode: anime.episode,
            cover_image: anime.coverImage,
          },
        });
        notified++;
      } catch (err) {
        console.warn(`Push failed for user ${sub.user_id}:`, err);
        // Mark subscription inactive if expired
        if ((err as any)?.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('user_id', sub.user_id);
        }
      }
    }
  }

  return NextResponse.json({ success: true, notified, checked: recentlyAired.length });
}

// GET: Returns recent airing schedule (public, for the notifications page)
export async function GET() {
  const aired = await fetchRecentlyAired();
  return NextResponse.json({ airings: aired.slice(0, 20) });
}
