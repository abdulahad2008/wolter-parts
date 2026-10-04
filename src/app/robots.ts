import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { env } from "@/lib/env";

export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
  if (!env.allowIndexing) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/go", "/royxat"] },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
