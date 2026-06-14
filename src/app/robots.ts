import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aniverse.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/manga", "/search", "/seasonal", "/top", "/about", "/anime/"],
        disallow: ["/api/", "/auth/", "/settings", "/login", "/register", "/profile", "/mylist", "/notifications"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/auth/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
