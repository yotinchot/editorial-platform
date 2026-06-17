import type { MetadataRoute } from "next";

import { getAllCategories } from "@/lib/data/categories";
import { getPublishedPostsForSitemap } from "@/lib/data/posts";
import { SITE_URL } from "@/lib/metadata";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categoryRows, postRows] = await Promise.all([
    getAllCategories(),
    getPublishedPostsForSitemap(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categoryRows
    .filter((c) => c.postCount > 0)
    .map((c) => ({
      url: `${SITE_URL}/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  const postRoutes: MetadataRoute.Sitemap = postRows
    // Exclude posts with no real category (fallback "uncategorized")
    .filter((p) => p.categorySlug !== "uncategorized")
    .map((p) => ({
      url: `${SITE_URL}/${p.categorySlug}/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  return [...staticRoutes, ...categoryRoutes, ...postRoutes];
}
