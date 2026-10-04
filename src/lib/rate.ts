import "server-only";
import { headers } from "next/headers";

/**
 * Tiny in-memory counters (one server process). Entries expire after their window and the
 * map is pruned, so random keys can't grow memory without bound.
 */
type Hit = { n: number; since: number };
const buckets = new Map<string, Hit>();
const MAX_KEYS = 10_000;

function prune(now: number, windowMs: number) {
  for (const [k, h] of buckets) if (now - h.since > windowMs) buckets.delete(k);
  // Still too many (an attack with many IPs): drop the oldest half.
  if (buckets.size > MAX_KEYS) {
    const keys = [...buckets.keys()].slice(0, Math.floor(buckets.size / 2));
    for (const k of keys) buckets.delete(k);
  }
}

export function hits(key: string, windowMs: number): number {
  const h = buckets.get(key);
  if (!h) return 0;
  if (Date.now() - h.since > windowMs) {
    buckets.delete(key);
    return 0;
  }
  return h.n;
}

export function bump(key: string, windowMs: number): number {
  const now = Date.now();
  if (buckets.size > MAX_KEYS) prune(now, windowMs);
  const h = buckets.get(key);
  if (!h || now - h.since > windowMs) {
    buckets.set(key, { n: 1, since: now });
    return 1;
  }
  h.n += 1;
  return h.n;
}

export function forget(key: string) {
  buckets.delete(key);
}

/** true while `key` has made fewer than `limit` calls in the window (and counts this one). */
export function allow(key: string, limit: number, windowMs: number): boolean {
  return bump(key, windowMs) <= limit;
}

/**
 * The visitor's IP. Traefik appends the address it received the request from to X-Forwarded-For,
 * so the last entry is the one we can trust (anything before it could be typed by the client).
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  // Only when the site sits behind the Cloudflare proxy (orange cloud); otherwise anyone could fake it.
  const cf = process.env.TRUST_CLOUDFLARE === "true" ? h.get("cf-connecting-ip") : null;
  if (cf) return cf.trim().slice(0, 64);
  const xff = h.get("x-forwarded-for");
  const last = xff?.split(",").map((s) => s.trim()).filter(Boolean).at(-1);
  return (last ?? h.get("x-real-ip") ?? "local").slice(0, 64);
}
