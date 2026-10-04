import "server-only";
import { and, asc, count, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "./db";
import { admins, buyClicks, categories, products } from "./schema";

export type AdminRow = {
  id: number;
  sku: string;
  slug: string;
  name: string;
  categoryId: number | null;
  categoryName: string;
  price: number;
  stock: "in" | "low" | "out";
  visible: boolean;
  archived: boolean;
  position: number;
  image: string | null; // media key
  clicks7: number;
};

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

/** Taps on «Sotib olish» per product since `days` ago. */
export async function clicksByProduct(days: number): Promise<Map<number, number>> {
  const rows = await getDb()
    .select({ productId: buyClicks.productId, n: count() })
    .from(buyClicks)
    .where(and(gte(buyClicks.createdAt, daysAgo(days)), isNotNull(buyClicks.productId)))
    .groupBy(buyClicks.productId);
  return new Map(rows.map((r) => [r.productId as number, Number(r.n)]));
}

export async function adminProducts(): Promise<{ active: AdminRow[]; archived: AdminRow[] }> {
  await connection();
  const db = getDb();
  const [rows, cats, clicks] = await Promise.all([
    db.select().from(products).orderBy(asc(products.position), asc(products.id)),
    db.select().from(categories),
    clicksByProduct(7),
  ]);
  const catName = new Map(cats.map((c) => [c.id, c.name]));
  const mapped: AdminRow[] = rows.map((p) => ({
    id: p.id,
    sku: p.sku,
    slug: p.slug,
    name: p.name,
    categoryId: p.categoryId,
    categoryName: p.categoryId ? catName.get(p.categoryId) ?? "—" : "—",
    price: p.price,
    stock: p.stock,
    visible: p.visible,
    archived: p.archived,
    position: p.position,
    image: p.images[0]?.key ?? null,
    clicks7: clicks.get(p.id) ?? 0,
  }));
  return { active: mapped.filter((p) => !p.archived), archived: mapped.filter((p) => p.archived) };
}

export async function adminProduct(id: number) {
  await connection();
  const rows = await getDb().select().from(products).where(eq(products.id, id));
  return rows[0] ?? null;
}

/** Place of a product among the active ones (1-based), as shown on the site. */
export async function sitePosition(id: number): Promise<number> {
  const rows = await getDb()
    .select({ id: products.id })
    .from(products)
    .where(eq(products.archived, false))
    .orderBy(asc(products.position), asc(products.id));
  return rows.findIndex((r) => r.id === id) + 1;
}

export async function productClicks(id: number) {
  const db = getDb();
  const [[d7], [d30]] = await Promise.all([
    db.select({ n: count() }).from(buyClicks).where(and(eq(buyClicks.productId, id), gte(buyClicks.createdAt, daysAgo(7)))),
    db.select({ n: count() }).from(buyClicks).where(and(eq(buyClicks.productId, id), gte(buyClicks.createdAt, daysAgo(30)))),
  ]);
  return { d7: Number(d7.n), d30: Number(d30.n) };
}

export async function adminCategories() {
  await connection();
  const db = getDb();
  const [cats, counts] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.position), asc(categories.id)),
    db
      .select({ categoryId: products.categoryId, n: count() })
      .from(products)
      .where(eq(products.archived, false))
      .groupBy(products.categoryId),
  ]);
  const n = new Map(counts.map((c) => [c.categoryId, Number(c.n)]));
  return cats.map((c) => ({ ...c, productCount: n.get(c.id) ?? 0 }));
}

export async function nextSku(): Promise<string> {
  const rows = await getDb().select({ sku: products.sku }).from(products);
  const max = rows.reduce((m, r) => {
    const match = /^WP-(\d+)$/i.exec(r.sku);
    return match ? Math.max(m, Number(match[1])) : m;
  }, 0);
  return `WP-${String(max + 1).padStart(3, "0")}`;
}

export async function adminList() {
  await connection();
  return getDb()
    .select({ id: admins.id, email: admins.email, name: admins.name, lastLoginAt: admins.lastLoginAt })
    .from(admins)
    .orderBy(asc(admins.id));
}

export async function clickStats() {
  await connection();
  const db = getDb();
  const [byProduct7, byProduct30, all, perDay, lists] = await Promise.all([
    clicksByProduct(7),
    clicksByProduct(30),
    db.select({ productId: buyClicks.productId, n: count() }).from(buyClicks).groupBy(buyClicks.productId),
    db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${buyClicks.createdAt} AT TIME ZONE 'Asia/Tashkent'), 'YYYY-MM-DD')`,
        n: count(),
      })
      .from(buyClicks)
      .where(gte(buyClicks.createdAt, daysAgo(14)))
      .groupBy(sql`1`)
      .orderBy(sql`1`),
    db
      .select({
        groupId: buyClicks.groupId,
        at: sql<Date>`min(${buyClicks.createdAt})`,
        items: sql<number>`count(*)::int`,
        qty: sql<number>`sum(${buyClicks.qty})::int`,
        skus: sql<string>`string_agg(${buyClicks.sku} || case when ${buyClicks.size} <> '' then ' (' || ${buyClicks.size} || ')' else '' end || ' × ' || ${buyClicks.qty}, ', ')`,
      })
      .from(buyClicks)
      .where(and(eq(buyClicks.kind, "list"), isNotNull(buyClicks.groupId)))
      .groupBy(buyClicks.groupId)
      .orderBy(desc(sql`min(${buyClicks.createdAt})`))
      .limit(20),
  ]);
  const prods = await db.select({ id: products.id, name: products.name, sku: products.sku }).from(products);
  const allMap = new Map(all.map((r) => [r.productId, Number(r.n)]));
  const table = prods
    .map((p) => ({ ...p, d7: byProduct7.get(p.id) ?? 0, d30: byProduct30.get(p.id) ?? 0, total: allMap.get(p.id) ?? 0 }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.d30 - a.d30 || b.total - a.total);
  const sum = (m: Map<number, number>) => [...m.values()].reduce((s, n) => s + n, 0);
    // One bar per day for the last 14 days (Tashkent time), zero when nothing happened.
  const counts = new Map(perDay.map((d) => [d.day, Number(d.n)]));
  const days = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(Date.now() + 5 * 3600_000 - (13 - i) * 86_400_000).toISOString().slice(0, 10);
    return { day, n: counts.get(day) ?? 0 };
  });
  return { table, total7: sum(byProduct7), total30: sum(byProduct30), perDay: days, lists };
}
