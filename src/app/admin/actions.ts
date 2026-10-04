"use server";

import { randomBytes } from "node:crypto";
import { access, copyFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { and, asc, count, eq, max, ne, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { nextSku } from "@/lib/admin-data";
import { getSession, loginSucceeded, requireAdmin, startLoginAttempt, UnauthorizedError } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { env } from "@/lib/env";
import { slugify } from "@/lib/format";
import { deleteProductImage, IMAGE_SIZES } from "@/lib/images";
import { clientIp } from "@/lib/rate";
import { admins, categories, products, settings, type ProductImage } from "@/lib/schema";
import { cleanUsername } from "@/lib/telegram";

export type ActionResult =
  | { ok: true; message?: string; id?: number }
  | { ok: false; error: string; field?: string; email?: string };

const fail = (error: string, field?: string): ActionResult => ({ ok: false, error, field });

/**
 * Runs an action and turns unexpected errors into a message instead of an error page,
 * so an admin never loses a half-filled form. redirect() still works (it is re-thrown).
 */
async function safe(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await fn();
  } catch (err) {
    unstable_rethrow(err);
    if (err instanceof UnauthorizedError) return fail("Sessiya tugagan. Boshqa oynada qayta kiring, keyin yana saqlang.");
    const code = (err as { code?: string; cause?: { code?: string } })?.code ?? (err as { cause?: { code?: string } })?.cause?.code;
    if (code === "23505") return fail("Bu SKU yoki sahifa manzili band. Boshqasini yozing.");
    if (code === "23503") return fail("Tanlangan kategoriya o‘chirilgan. Sahifani yangilang.");
    console.error("[admin action]", err);
    return fail("Saqlab bo‘lmadi. Qayta urinib ko‘ring.");
  }
}

// ---------------------------------------------------------------- login

let dummyHash: Promise<string> | null = null;
/** A real bcrypt hash, so checking an unknown email takes as long as checking a real one. */
function getDummyHash() {
  dummyHash ??= bcrypt.hash("wolter-parts-timing-guard", 12);
  return dummyHash;
}

export async function login(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 254);
  const password = String(form.get("password") ?? "").slice(0, 200);
  if (!email || !password) return { ok: false, email, error: "Email va parolni kiriting." };

  const ip = await clientIp();
  if (!startLoginAttempt(ip, email)) {
    return { ok: false, email, error: "Juda ko‘p urinish. 15 daqiqadan keyin qayta urinib ko‘ring." };
  }

  const db = getDb();
  const [admin] = await db.select().from(admins).where(eq(admins.email, email));
  const ok = await bcrypt.compare(password, admin?.passwordHash ?? (await getDummyHash()));
  if (!admin || !ok) return { ok: false, email, error: "Email yoki parol noto‘g‘ri." };

  loginSucceeded(ip, email);
  const session = await getSession();
  session.adminId = admin.id;
  session.v = admin.sessionVersion;
  await session.save();
  await db.update(admins).set({ lastLoginAt: new Date() }).where(eq(admins.id, admin.id));
  redirect("/admin");
}

export async function logout(): Promise<void> {
  const session = await getSession();
  session.destroy();
  redirect("/admin/login");
}

// ---------------------------------------------------------------- products list

export async function saveOrder(ids: number[]): Promise<ActionResult> {
  return safe(async () => {
    await requireAdmin();
    const parsed = z.array(z.number().int().positive()).max(1000).safeParse(ids);
    if (!parsed.success) return fail("Noto‘g‘ri tartib.");
    const db = getDb();
    const active = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.archived, false))
      .orderBy(asc(products.position), asc(products.id));
    const activeIds = new Set(active.map((p) => p.id));
    const order = [...new Set(parsed.data)].filter((id) => activeIds.has(id));
    // Anything missing from the list (e.g. added in another tab) goes to the end.
    for (const p of active) if (!order.includes(p.id)) order.push(p.id);
    await db.transaction(async (tx) => {
      for (let i = 0; i < order.length; i++) {
        await tx.update(products).set({ position: i + 1 }).where(eq(products.id, order[i]));
      }
    });
    refresh();
    return { ok: true, message: "Yangi tartib saqlandi" };
  });
}

export async function setVisible(id: number, visible: boolean): Promise<ActionResult> {
  return safe(async () => {
    await requireAdmin();
    await getDb().update(products).set({ visible: !!visible, updatedAt: new Date() }).where(eq(products.id, id));
    refresh();
    return { ok: true };
  });
}

export async function archiveProduct(id: number): Promise<ActionResult> {
  return safe(async () => {
    await requireAdmin();
    await getDb().update(products).set({ archived: true, visible: false, updatedAt: new Date() }).where(eq(products.id, id));
    refresh();
    return { ok: true, message: "Arxivga olindi" };
  });
}

export async function restoreProduct(id: number): Promise<ActionResult> {
  return safe(async () => {
    await requireAdmin();
    const db = getDb();
    const [{ top }] = await db.select({ top: max(products.position) }).from(products).where(eq(products.archived, false));
    await db
      .update(products)
      .set({ archived: false, visible: false, position: (top ?? 0) + 1, updatedAt: new Date() })
      .where(eq(products.id, id));
    refresh();
    return { ok: true, message: "Qaytarildi (saytda yashirin)" };
  });
}

export async function deleteProduct(id: number): Promise<ActionResult> {
  return safe(async () => {
    await requireAdmin();
    const db = getDb();
    const [p] = await db.select().from(products).where(eq(products.id, id));
    if (!p) return fail("Topilmadi.");
    if (!p.archived) return fail("Avval arxivga oling.");
    await db.delete(products).where(eq(products.id, id));
    await Promise.all(p.images.map((img) => deleteProductImage(img.key)));
    refresh();
    return { ok: true, message: "O‘chirildi" };
  });
}

async function uniqueSlug(base: string, exceptId?: number): Promise<string> {
  const db = getDb();
  const root = base || `mahsulot-${Date.now().toString(36)}`;
  for (let i = 1; i < 100; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    const where = exceptId ? and(eq(products.slug, candidate), ne(products.id, exceptId)) : eq(products.slug, candidate);
    const [{ n }] = await db.select({ n: count() }).from(products).where(where);
    if (Number(n) === 0) return candidate;
  }
  return `${root}-${randomBytes(3).toString("hex")}`;
}

export async function duplicateProduct(id: number): Promise<ActionResult> {
  return safe(async () => {
    await requireAdmin();
    const db = getDb();
    const [p] = await db.select().from(products).where(eq(products.id, id));
    if (!p) return fail("Topilmadi.");
    // Copy the photo files so each product owns its own.
    const images: ProductImage[] = [];
    for (const img of p.images) {
      const key = `${Date.now().toString(36)}${randomBytes(5).toString("hex")}`;
      try {
        for (const size of IMAGE_SIZES) {
          await copyFile(path.join(env.mediaDir, `${img.key}-${size}.webp`), path.join(env.mediaDir, `${key}-${size}.webp`));
        }
        images.push({ ...img, key });
      } catch {
        /* missing file: skip that photo */
      }
    }
    const [{ top }] = await db.select({ top: max(products.position) }).from(products).where(eq(products.archived, false));
    const [created] = await db
      .insert(products)
      .values({
        ...p,
        id: undefined,
        sku: await nextSku(),
        slug: await uniqueSlug(`${p.slug}-nusxa`),
        name: `${p.name} (nusxa)`,
        images,
        visible: false,
        archived: false,
        position: (top ?? 0) + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: products.id });
    redirect(`/admin/products/${created.id}?copied=1`);
  });
}

// ---------------------------------------------------------------- product editor

const Stock = z.enum(["in", "low", "out"]);
const ProductInput = z.object({
  id: z.number().int().positive().optional(),
  // When the form was opened; a save from an out-of-date tab is refused.
  updatedAt: z.string().max(40).optional(),
  name: z.string().trim().min(2, "Nomini yozing").max(120),
  nameRu: z.string().trim().max(120).default(""),
  description: z.string().trim().max(3000).default(""),
  categoryId: z.number().int().positive().nullable(),
  sku: z.string().trim().min(1, "SKU kerak").max(40),
  slug: z.string().trim().max(80).default(""),
  price: z.number().int("Narx butun son bo‘lsin").min(1, "Narxni yozing").max(1_000_000_000),
  oldPrice: z.number().int().min(0).max(1_000_000_000).nullable(),
  stock: Stock,
  badge: z.enum(["", "new", "hit", "sale"]),
  sizes: z.array(z.object({ label: z.string().trim().min(1).max(12), stock: Stock })).max(20),
  specs: z.array(z.object({ k: z.string().trim().max(60), v: z.string().trim().max(200) })).max(20),
  images: z
    .array(z.object({ key: z.string().regex(/^[a-z0-9]{6,40}$/), w: z.number().int(), h: z.number().int() }))
    .max(6, "6 tagacha rasm"),
  visible: z.boolean(),
});
export type ProductInputType = z.input<typeof ProductInput>;

async function fileExists(key: string): Promise<boolean> {
  try {
    await access(path.join(env.mediaDir, `${key}-480.webp`));
    return true;
  } catch {
    return false;
  }
}

export async function saveProduct(input: ProductInputType): Promise<ActionResult> {
  return safe(async () => {
    await requireAdmin();
    const parsed = ProductInput.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return fail(issue?.message ?? "Ma’lumotlarni tekshiring.", String(issue?.path?.[0] ?? ""));
    }
    const d = parsed.data;
    const db = getDb();

    const old = d.id ? (await db.select().from(products).where(eq(products.id, d.id)))[0] : undefined;
    if (d.id && !old) return fail("Mahsulot topilmadi — u o‘chirilgan bo‘lishi mumkin.");
    if (old && d.updatedAt && old.updatedAt.getTime() > Date.parse(d.updatedAt) + 1) {
      return fail("Bu mahsulot boshqa oynada o‘zgartirilgan. Sahifani yangilang — bu yerdagi o‘zgarishlar saqlanmadi.");
    }

    const skuWhere = sql`lower(${products.sku}) = lower(${d.sku})`;
    const skuTaken = await db.select({ id: products.id }).from(products).where(d.id ? and(skuWhere, ne(products.id, d.id)) : skuWhere);
    if (skuTaken.length) return fail("Bu SKU boshqa mahsulotda bor.", "sku");

    let slug = slugify(d.slug);
    if (d.slug && slug) {
      const where = d.id ? and(eq(products.slug, slug), ne(products.id, d.id)) : eq(products.slug, slug);
      const taken = await db.select({ id: products.id }).from(products).where(where);
      if (taken.length) return fail("Bu sahifa manzili band.", "slug");
    } else {
      slug = await uniqueSlug(slugify(d.name), d.id);
    }

    // Keep only photos whose files really exist.
    const images: ProductImage[] = [];
    for (const img of d.images) if (!images.some((x) => x.key === img.key) && (await fileExists(img.key))) images.push(img);

    const values = {
      name: d.name,
      nameRu: d.nameRu,
      description: d.description,
      categoryId: d.categoryId,
      sku: d.sku.toUpperCase(),
      slug,
      price: d.price,
      oldPrice: d.oldPrice && d.oldPrice > d.price ? d.oldPrice : null,
      stock: d.stock,
      badge: d.badge,
      sizes: d.sizes.filter((s, i, all) => all.findIndex((x) => x.label.toLowerCase() === s.label.toLowerCase()) === i),
      specs: d.specs.filter((s) => s.k && s.v),
      images,
      visible: d.visible,
      updatedAt: new Date(),
    };

    if (old) {
      await db.update(products).set(values).where(eq(products.id, old.id));
      const kept = new Set(images.map((i) => i.key));
      await Promise.all(old.images.filter((i) => !kept.has(i.key)).map((i) => deleteProductImage(i.key)));
      refresh();
      return { ok: true, id: old.id, message: "Saqlandi" };
    }

    const [{ top }] = await db.select({ top: max(products.position) }).from(products).where(eq(products.archived, false));
    const [created] = await db
      .insert(products)
      .values({ ...values, position: (top ?? 0) + 1 })
      .returning({ id: products.id });
    redirect(`/admin/products/${created.id}?created=1`);
  });
}

// ---------------------------------------------------------------- settings

const SettingsInput = z.object({
  tgMode: z.enum(["manager", "bot"]),
  tgManager: z.string().trim().max(64),
  tgBot: z.string().trim().max(64),
  template: z.string().trim().min(5, "Shablon bo‘sh bo‘lmasin").max(1000),
  address: z.string().trim().max(200),
  landmark: z.string().trim().max(200),
  hours: z.string().trim().max(120),
  phone: z.string().trim().max(40),
  mapUrl: z.union([z.literal(""), z.url("Havola https:// bilan boshlansin").max(500)]),
});
export type SettingsInputType = z.input<typeof SettingsInput>;

export async function saveSettings(input: SettingsInputType): Promise<ActionResult> {
  return safe(async () => {
    await requireAdmin();
    const parsed = SettingsInput.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return fail(issue?.message ?? "Ma’lumotlarni tekshiring.", String(issue?.path?.[0] ?? ""));
    }
    const d = parsed.data;
    const manager = cleanUsername(d.tgManager);
    const bot = cleanUsername(d.tgBot);
    if (!manager) return fail("Menejer username’ini yozing.", "tgManager");
    if (d.tgMode === "bot" && !bot) return fail("Bot rejimi uchun bot username’ini yozing.", "tgBot");
    await getDb()
      .update(settings)
      .set({ ...d, tgManager: manager, tgBot: bot, updatedAt: new Date() })
      .where(eq(settings.id, 1));
    refresh();
    return { ok: true, message: "Saqlandi" };
  });
}

// ---------------------------------------------------------------- categories

const CatName = z.string().trim().min(2, "Nomini yozing").max(60);

export async function createCategory(name: string): Promise<ActionResult> {
  return safe(async () => {
    await requireAdmin();
    const parsed = CatName.safeParse(name);
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    const db = getDb();
    let slug = slugify(parsed.data) || `kategoriya-${Date.now().toString(36)}`;
    const taken = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug));
    if (taken.length) slug = `${slug}-${randomBytes(2).toString("hex")}`;
    const [{ top }] = await db.select({ top: max(categories.position) }).from(categories);
    await db.insert(categories).values({ name: parsed.data, slug, position: (top ?? 0) + 1 });
    refresh();
    return { ok: true, message: "Qo‘shildi" };
  });
}

export async function renameCategory(id: number, name: string): Promise<ActionResult> {
  return safe(async () => {
    await requireAdmin();
    const parsed = CatName.safeParse(name);
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    await getDb().update(categories).set({ name: parsed.data }).where(eq(categories.id, id));
    refresh();
    return { ok: true, message: "Saqlandi" };
  });
}

export async function setCategoryVisible(id: number, visible: boolean): Promise<ActionResult> {
  return safe(async () => {
    await requireAdmin();
    await getDb().update(categories).set({ visible: !!visible }).where(eq(categories.id, id));
    refresh();
    return { ok: true };
  });
}

export async function moveCategory(id: number, dir: -1 | 1): Promise<ActionResult> {
  return safe(async () => {
    await requireAdmin();
    const db = getDb();
    const all = await db.select({ id: categories.id }).from(categories).orderBy(asc(categories.position), asc(categories.id));
    const i = all.findIndex((c) => c.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= all.length) return { ok: true };
    const order = all.map((c) => c.id);
    [order[i], order[j]] = [order[j], order[i]];
    await db.transaction(async (tx) => {
      for (let k = 0; k < order.length; k++) await tx.update(categories).set({ position: k + 1 }).where(eq(categories.id, order[k]));
    });
    refresh();
    return { ok: true };
  });
}

export async function deleteCategory(id: number): Promise<ActionResult> {
  return safe(async () => {
    await requireAdmin();
    const db = getDb();
    // Archived products don't block deleting; they just lose their category.
    const [{ n }] = await db
      .select({ n: count() })
      .from(products)
      .where(and(eq(products.categoryId, id), eq(products.archived, false)));
    if (Number(n) > 0) return fail("Bu kategoriyada mahsulotlar bor. Avval ularni boshqa kategoriyaga o‘tkazing.");
    await db.delete(categories).where(eq(categories.id, id));
    refresh();
    return { ok: true, message: "O‘chirildi" };
  });
}

// ---------------------------------------------------------------- admins

export async function addAdmin(input: { email: string; name: string; password: string }): Promise<ActionResult> {
  return safe(async () => {
    await requireAdmin();
    const parsed = z
      .object({
        email: z.email("Email noto‘g‘ri").max(254).transform((s) => s.trim().toLowerCase()),
        name: z.string().trim().min(2, "Ismini yozing").max(60),
        password: z.string().min(8, "Parol kamida 8 belgi").max(200),
      })
      .safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    const db = getDb();
    const exists = await db.select({ id: admins.id }).from(admins).where(eq(admins.email, parsed.data.email));
    if (exists.length) return fail("Bu email bilan admin bor.");
    await db.insert(admins).values({
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
    });
    refresh();
    return { ok: true, message: "Admin qo‘shildi" };
  });
}

export async function removeAdmin(id: number): Promise<ActionResult> {
  return safe(async () => {
    const me = await requireAdmin();
    if (me.id === id) return fail("O‘zingizni o‘chira olmaysiz.");
    const db = getDb();
    const [{ n }] = await db.select({ n: count() }).from(admins);
    if (Number(n) <= 1) return fail("Kamida bitta admin qolishi kerak.");
    await db.delete(admins).where(eq(admins.id, id));
    refresh();
    return { ok: true, message: "O‘chirildi" };
  });
}

/** Changes the password and logs this admin out on every other device. */
export async function changePassword(input: { current: string; next: string }): Promise<ActionResult> {
  return safe(async () => {
    const me = await requireAdmin();
    const next = String(input?.next ?? "");
    if (next.length < 8 || next.length > 200) return fail("Yangi parol kamida 8 belgi bo‘lsin.");
    const db = getDb();
    const [row] = await db.select().from(admins).where(eq(admins.id, me.id));
    if (!row || !(await bcrypt.compare(String(input?.current ?? "").slice(0, 200), row.passwordHash))) {
      return fail("Joriy parol noto‘g‘ri.");
    }
    const version = row.sessionVersion + 1;
    await db.update(admins).set({ passwordHash: await bcrypt.hash(next, 12), sessionVersion: version }).where(eq(admins.id, me.id));
    const session = await getSession();
    session.v = version;
    await session.save();
    return { ok: true, message: "Parol o‘zgartirildi. Boshqa qurilmalardan chiqildi." };
  });
}
