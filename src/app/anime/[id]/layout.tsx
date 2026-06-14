import type { Metadata } from "next";

const ANILIST_API = "https://graphql.anilist.co";

async function fetchAnimeMetadata(id: string) {
  try {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          title { romaji english native }
          description(asHtml: false)
          coverImage { extraLarge large }
          bannerImage
          genres
          averageScore
          season
          seasonYear
          format
          status
          episodes
          studios(isMain: true) { nodes { name } }
        }
      }
    `;
    const res = await fetch(ANILIST_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { id: parseInt(id) } }),
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return data?.data?.Media || null;
  } catch {
    return null;
  }
}

function stripHtmlTags(text: string): string {
  return text?.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() || "";
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const anime = await fetchAnimeMetadata(id);

  if (!anime) {
    return { title: "Anime Tidak Ditemukan" };
  }

  const title = anime.title?.english || anime.title?.romaji || "Anime";
  const description = stripHtmlTags(anime.description || "").slice(0, 160);
  const image = anime.coverImage?.extraLarge || anime.coverImage?.large;
  const genres = (anime.genres || []).join(", ");
  const studio = anime.studios?.nodes?.[0]?.name || "";
  const score = anime.averageScore ? `${anime.averageScore}%` : "";

  const fullDescription = [
    description,
    genres ? `Genre: ${genres}` : "",
    studio ? `Studio: ${studio}` : "",
    score ? `Rating: ${score}` : "",
  ].filter(Boolean).join(" | ");

  return {
    title: `${title} — AniVerse`,
    description: fullDescription.slice(0, 300),
    keywords: [
      title,
      anime.title?.romaji,
      "anime",
      "nonton anime",
      ...((anime.genres || []) as string[]),
      studio,
    ].filter(Boolean) as string[],
    openGraph: {
      type: "video.tv_show",
      title: `${title} — AniVerse`,
      description: fullDescription.slice(0, 200),
      images: image ? [{ url: image, width: 460, height: 650, alt: title }] : [],
      siteName: "AniVerse",
      locale: "id_ID",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — AniVerse`,
      description: fullDescription.slice(0, 200),
      images: image ? [image] : [],
    },
    alternates: {
      canonical: `/anime/${id}`,
    },
  };
}

export default async function AnimeDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const anime = await fetchAnimeMetadata(id);

  const jsonLd = anime
    ? {
        "@context": "https://schema.org",
        "@type": "TVSeries",
        "name": anime.title?.english || anime.title?.romaji || "Anime",
        "alternateName": anime.title?.romaji !== anime.title?.english ? anime.title?.romaji : undefined,
        "description": stripHtmlTags(anime.description || "").slice(0, 250),
        "image": anime.coverImage?.extraLarge || anime.coverImage?.large,
        "genre": anime.genres,
        "numberOfEpisodes": anime.episodes,
        "productionCompany": anime.studios?.nodes?.[0]?.name
          ? { "@type": "Organization", name: anime.studios.nodes[0].name }
          : undefined,
        "aggregateRating": anime.averageScore
          ? {
              "@type": "AggregateRating",
              "ratingValue": anime.averageScore / 10,
              "bestRating": 10,
              "worstRating": 0,
            }
          : undefined,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
