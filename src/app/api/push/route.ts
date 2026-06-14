import { NextResponse } from 'next/server';
import webpush from 'web-push';

export async function POST(request: Request) {
  try {
    const { subscription, title, body } = await request.json();

    if (!subscription) {
      return NextResponse.json({ error: 'Missing subscription' }, { status: 400 });
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@aniverse.app';

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn("VAPID keys not configured in .env.local");
      return NextResponse.json({ error: 'Server not configured for push' }, { status: 500 });
    }

    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );

    const payload = JSON.stringify({
      title: title || 'Notifikasi AniVerse',
      body: body || 'Episode baru sudah rilis!',
      url: '/',
    });

    await webpush.sendNotification(subscription, payload);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
