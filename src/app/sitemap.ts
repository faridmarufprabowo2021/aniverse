import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aniverse.vercel.app";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/manga`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/seasonal`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/top`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/schedule`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Fetch popular anime IDs from AniList for dynamic pages
  let animePages: MetadataRoute.Sitemap = [];
  try {
    const query = `
      query {
        Page(page: 1, perPage: 50) {
          media(type: ANIME, sort: POPULARITY_DESC) {
            id
            updatedAt
          }
        }
      }
    `;
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      next: { revalidate: 86400 }, // Cache for 24 hours
    });
    const data = await res.json();
    const mediaList = data?.data?.Page?.media || [];

    animePages = mediaList.map((m: any) => ({
      url: `${baseUrl}/anime/${m.id}`,
      lastModified: m.updatedAt ? new Date(m.updatedAt * 1000) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Silently fail — sitemap still works without dynamic anime pages
  }

  return [...staticPages, ...animePages];
}
