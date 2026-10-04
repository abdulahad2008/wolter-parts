import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { getShopProducts } from "@/lib/shop";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getShopProducts();
  return [
    { url: `${env.siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${env.siteUrl}/manzil`, changeFrequency: "monthly", priority: 0.5 },
    ...products.map((p) => ({ url: `${env.siteUrl}/p/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
