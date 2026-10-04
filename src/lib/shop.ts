import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { cache } from "react";
import { getDb } from "./db";
import { siteHost } from "./env";
import { categories, products, settings, type Product, type Settings } from "./schema";
import { cleanUsername, DEFAULT_TEMPLATE, type BuyTarget } from "./telegram";

/** What the browser gets for each product — no admin-only fields. */
export type ShopProduct = {
  id: number;
  sku: string;
  slug: string;
  name: string;
  description: string;
  categoryId: number | null;
  price: number;
  oldPrice: number | null;
  stock: Product["stock"];
  badge: Product["badge"];
  sizes: Product["sizes"];
  specs: Product["specs"];
  images: Product["images"];
  createdAt: string;
};

export type ShopCategory = { id: number; name: string; slug: string };

export type StoreInfo = {
  address: string;
  landmark: string;
  hours: string;
  phone: string;
  phoneHref: string;
  mapUrl: string;
  chatUrl: string;
  chatHandle: string;
};

function toShop(p: Product): ShopProduct {
  return {
    id: p.id,
    sku: p.sku,
    slug: p.slug,
    name: p.name,
    description: p.description,
    categoryId: p.categoryId,
    price: p.price,
    oldPrice: p.oldPrice,
    stock: p.stock,
    badge: p.badge,
    sizes: p.sizes,
    specs: p.specs,
    images: p.images,
    createdAt: p.createdAt.toISOString(),
  };
}

const onSite = and(eq(products.visible, true), eq(products.archived, false));

export const getSettings = cache(async (): Promise<Settings> => {
  await connection();
  const rows = await getDb().select().from(settings).where(eq(settings.id, 1));
  return (
    rows[0] ?? {
      id: 1,
      tgMode: "manager",
      tgManager: "wolteruz",
      tgBot: "",
      template: DEFAULT_TEMPLATE,
      address: "",
      landmark: "",
      hours: "",
      phone: "",
      mapUrl: "",
      updatedAt: new Date(),
    }
  );
});

export function buyTarget(s: Settings): BuyTarget {
  return {
    mode: s.tgMode,
    manager: cleanUsername(s.tgManager),
    bot: cleanUsername(s.tgBot),
    template: s.template,
    host: siteHost(),
  };
}

export function storeInfo(s: Settings): StoreInfo {
  const handle = cleanUsername(s.tgManager) || "wolteruz";
  return {
    address: s.address,
    landmark: s.landmark,
    hours: s.hours,
    phone: s.phone,
    phoneHref: `tel:${s.phone.replace(/[^\d+]/g, "")}`,
    mapUrl: s.mapUrl || "https://yandex.uz/maps/",
    chatUrl: `https://t.me/${handle}`,
    chatHandle: `@${handle}`,
  };
}

export const getShopProducts = cache(async (): Promise<ShopProduct[]> => {
  await connection();
  const rows = await getDb().select().from(products).where(onSite).orderBy(asc(products.position), asc(products.id));
  return rows.map(toShop);
});

/** Ids of every product that still exists (hidden and archived included). */
export async function getKnownProductIds(): Promise<number[]> {
  await connection();
  const rows = await getDb().select({ id: products.id }).from(products);
  return rows.map((r) => r.id);
}

/** Categories that are switched on and have at least one product on the site. */
export const getShopCategories = cache(async (): Promise<ShopCategory[]> => {
  await connection();
  const [cats, items] = await Promise.all([
    getDb().select().from(categories).where(eq(categories.visible, true)).orderBy(asc(categories.position), asc(categories.id)),
    getShopProducts(),
  ]);
  const used = new Set(items.map((p) => p.categoryId));
  return cats.filter((c) => used.has(c.id)).map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
});

export const getProductBySlug = cache(async (slug: string) => {
  await connection();
  const rows = await getDb().select().from(products).where(and(eq(products.slug, slug), onSite));
  if (!rows[0]) return null;
  const p = rows[0];
  const cat = p.categoryId
    ? (await getDb().select().from(categories).where(eq(categories.id, p.categoryId)))[0] ?? null
    : null;
  return { product: toShop(p), category: cat ? { id: cat.id, name: cat.name, slug: cat.slug } : null };
});

/** Up to 4 products to show under a product: same category first, then the rest in site order. */
export async function getRelated(p: ShopProduct): Promise<ShopProduct[]> {
  const all = (await getShopProducts()).filter((x) => x.id !== p.id && x.stock !== "out");
  const same = all.filter((x) => x.categoryId === p.categoryId);
  const rest = all.filter((x) => x.categoryId !== p.categoryId);
  return [...same, ...rest].slice(0, 4);
}
