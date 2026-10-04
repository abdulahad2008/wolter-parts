import { randomBytes } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { allow, clientIp } from "@/lib/rate";
import { buyClicks, products } from "@/lib/schema";

const MAX_BODY = 4096;
const Body = z.object({
  kind: z.enum(["single", "list"]),
  items: z
    .array(z.object({ id: z.number().int().positive(), size: z.string().max(20).default(""), qty: z.number().int().min(1).max(99).default(1) }))
    .min(1)
    .max(30),
});

/** Counts taps on «Sotib olish». Called with navigator.sendBeacon, so the answer is never read. */
export async function POST(req: Request) {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY) return new Response(null, { status: 413 });
  // 30 taps a minute per visitor is far more than a person makes.
  if (!allow(`click:${await clientIp()}`, 30, 60_000)) return new Response(null, { status: 429 });
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) return new Response(null, { status: 413 });
    const parsed = Body.safeParse(JSON.parse(text));
    if (!parsed.success) return new Response(null, { status: 400 });
    const { kind } = parsed.data;
    // One row per product + size.
    const items = parsed.data.items.filter((it, i, all) => all.findIndex((x) => x.id === it.id && x.size === it.size) === i);
    const db = getDb();
    const found = await db
      .select({ id: products.id, sku: products.sku })
      .from(products)
      .where(and(inArray(products.id, items.map((i) => i.id)), eq(products.visible, true), eq(products.archived, false)));
    const sku = new Map(found.map((p) => [p.id, p.sku]));
    const groupId = kind === "list" ? randomBytes(6).toString("hex") : null;
    const rows = items
      .filter((i) => sku.has(i.id))
      .map((i) => ({ productId: i.id, sku: sku.get(i.id)!, size: i.size, qty: i.qty, kind, groupId }));
    if (rows.length) await db.insert(buyClicks).values(rows);
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 400 });
  }
}
