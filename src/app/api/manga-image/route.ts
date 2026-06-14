import { NextRequest, NextResponse } from "next/server";

/**
 * Manga Image Proxy — Resolves hotlink protection from manga CDNs
 * 
 * Usage: /api/manga-image?url=<encoded_image_url>
 * 
 * This proxy fetches manga images server-side with the correct Referer header,
 * bypassing CDN hotlink protection that blocks direct browser requests.
 * Only allows whitelisted manga CDN domains for security.
 */

// Allowed CDN domains — only these can be proxied (security)
const ALLOWED_DOMAINS = [
  "imageainewgeneration.lol",
  "himmga.lat",
  "gaimgame.pics",
  "komikindo.ch",
  "cdn.komikindo.ch",
  "i0.wp.com",
  "i1.wp.com",
  "i2.wp.com",
  "i3.wp.com",
  "cdn.jsdelivr.net",
  "storage.googleapis.com",
  "telegra.ph",
  "cdn.statically.io",
  "mefrasa.xyz",
  "images.unsplash.com",
  "assets.komikindo.ch",
  // Common manga CDN patterns — allow any that match
];

// Additional domain patterns (regex)
const ALLOWED_PATTERNS = [
  /^.*\.wp\.com$/,
  /^.*komikindo.*$/,
  /^.*manga.*$/,
  /^.*komik.*$/,
  /^.*cdn.*\.lol$/,
  /^.*cdn.*\.lat$/,
  /^.*cdn.*\.pics$/,
];

function isDomainAllowed(hostname: string): boolean {
  if (ALLOWED_DOMAINS.includes(hostname)) return true;
  return ALLOWED_PATTERNS.some(pattern => pattern.test(hostname));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
  }

  // Decode and validate URL
  let decoded: string;
  try {
    decoded = decodeURIComponent(imageUrl);
    new URL(decoded); // validate it's a proper URL
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Security: only allow whitelisted domains
  const urlObj = new URL(decoded);
  if (!isDomainAllowed(urlObj.hostname)) {
    return NextResponse.json(
      { error: `Domain not allowed: ${urlObj.hostname}` },
      { status: 403 }
    );
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(decoded, {
      signal: controller.signal,
      headers: {
        // Spoof Referer to bypass hotlink protection
        "Referer": "https://komikindo.ch/",
        "Origin": "https://komikindo.ch",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
        "Sec-Fetch-Dest": "image",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "cross-site",
      },
    });

    clearTimeout(timer);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Aggressive caching — 24 hours on Vercel CDN, 12 hours in browser
        "Cache-Control": "public, s-maxage=86400, max-age=43200, stale-while-revalidate=604800",
        "CDN-Cache-Control": "public, max-age=86400",
        "Vercel-CDN-Cache-Control": "public, max-age=86400",
        // Prevent the proxy from being used as an open redirect
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      },
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return NextResponse.json({ error: "Timeout fetching image" }, { status: 504 });
    }
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }
}

// Config: edge runtime for faster cold starts and lower latency
export const runtime = "edge";
