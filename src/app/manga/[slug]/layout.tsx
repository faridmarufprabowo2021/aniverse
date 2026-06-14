import type { Metadata } from "next";

const SANKA_BASE = "https://www.sankavollerei.web.id/comic/komikindo";

async function fetchMangaMeta(slug: string) {
  try {
    const res = await fetch(`${SANKA_BASE}/detail/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const manga = await fetchMangaMeta(slug);

  if (!manga) {
    return { title: "Manga Tidak Ditemukan" };
  }

  const title = (manga.title || "Manga").replace(/^Komik\n\s*/i, "").trim();
  const desc = (manga.description || "").slice(0, 160);
  const image = manga.image;
  const type = manga.detail?.type || "Manga";
  const author = manga.detail?.author || "";
  const genres = (manga.genres || []).map((g: any) => g.name).join(", ");
  const rating = manga.rating;

  const fullDesc = [
    desc,
    genres ? `Genre: ${genres}` : "",
    author ? `Author: ${author}` : "",
    rating ? `Rating: ${rating}/10` : "",
  ].filter(Boolean).join(" | ");

  return {
    title: `Baca ${title} — ${type} Online | AniVerse`,
    description: fullDesc.slice(0, 300),
    keywords: [title, type.toLowerCase(), "baca manga", "baca manhwa", "komik online", ...genres.split(", ")].filter(Boolean),
    openGraph: {
      type: "book",
      title: `Baca ${title} | AniVerse`,
      description: fullDesc.slice(0, 200),
      images: image ? [{ url: image, width: 236, height: 319, alt: title }] : [],
      siteName: "AniVerse",
      locale: "id_ID",
    },
    twitter: {
      card: "summary_large_image",
      title: `Baca ${title} | AniVerse`,
      description: fullDesc.slice(0, 200),
      images: image ? [image] : [],
    },
    alternates: {
      canonical: `/manga/${slug}`,
    },
  };
}

export default async function MangaDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const manga = await fetchMangaMeta(slug);

  const jsonLd = manga
    ? {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": (manga.title || "Manga").replace(/^Komik\n\s*/i, "").trim(),
        "description": (manga.description || "").slice(0, 250),
        "image": manga.image,
        "author": manga.detail?.author
          ? { "@type": "Person", "name": manga.detail.author }
          : undefined,
        "genre": (manga.genres || []).map((g: any) => g.name),
        "aggregateRating": manga.rating
          ? {
              "@type": "AggregateRating",
              "ratingValue": parseFloat(manga.rating),
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
