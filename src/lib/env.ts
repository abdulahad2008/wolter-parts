import path from "node:path";

/** Server-only settings read from environment variables. */
export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  sessionSecret: process.env.SESSION_SECRET ?? "",
  siteUrl: (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
  mediaDir: path.resolve(/*turbopackIgnore: true*/ process.env.MEDIA_DIR ?? "./data/media"),
  adminEmail: (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  adminName: process.env.ADMIN_NAME ?? "Admin",
  seedDemo: process.env.SEED_DEMO === "true",
  allowIndexing: process.env.ALLOW_INDEXING === "true",
  // Browsers only send Secure cookies over HTTPS (localhost excepted).
  cookieSecure: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === "true"
    : process.env.NODE_ENV === "production",
};

/** "parts.wolter.uz" — the site address without the protocol, for Telegram messages. */
export function siteHost(): string {
  return env.siteUrl.replace(/^https?:\/\//, "");
}
