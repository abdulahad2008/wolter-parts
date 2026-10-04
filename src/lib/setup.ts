import path from "node:path";
import bcrypt from "bcryptjs";
import { count, eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { getDb } from "./db";
import { env } from "./env";
import { saveIconImage } from "./images";
import { admins, categories, products, settings, type SizeOption, type StockLevel, type Badge } from "./schema";
import { DEFAULT_TEMPLATE } from "./telegram";

/** Called from instrumentation.ts. Without a database the shop cannot work, so stop and let Docker restart it. */
export async function runSetup(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    const secret = env.sessionSecret;
    if (secret.length < 32 || /change|example|secret-here|dev-secret/i.test(secret)) {
      console.error("[setup] SESSION_SECRET is missing or a placeholder. Set 32+ random characters (openssl rand -base64 32).");
      process.exit(1);
    }
    if (!process.env.SITE_URL) console.warn("[setup] SITE_URL is not set — Telegram messages will contain localhost links.");
  }
  try {
    await setupDatabase();
  } catch (err) {
    console.error("[setup] database setup failed:", err);
    process.exit(1);
  }
}

/**
 * Runs once when the server starts: applies database migrations, then fills in
 * what an empty install needs (settings row, categories, first admin, demo products).
 */
export async function setupDatabase(): Promise<void> {
  const db = getDb();
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

  const existing = await db.select({ id: settings.id }).from(settings).where(eq(settings.id, 1));
  if (existing.length === 0) {
    await db.insert(settings).values({
      id: 1,
      tgMode: "manager",
      tgManager: "wolteruz",
      tgBot: "",
      template: DEFAULT_TEMPLATE,
      address: "Beshyog‘och 55/1, Toshkent",
      landmark: "Magic City to‘g‘risida",
      hours: "10:00 – 20:00 · Har kuni",
      phone: "+998 97 677 26 62",
      mapUrl: "https://yandex.uz/maps/-/CXeQeE8V",
    });
    console.log("[setup] settings created");
  }

  const [{ n: catCount }] = await db.select({ n: count() }).from(categories);
  if (catCount === 0) {
    await db.insert(categories).values([
      { name: "Xavfsizlik", slug: "xavfsizlik", position: 1 },
      { name: "Kuryer jihozlari", slug: "kuryer-jihozlari", position: 2 },
      { name: "Ehtiyot qismlar", slug: "ehtiyot-qismlar", position: 3 },
      { name: "Aksessuarlar", slug: "aksessuarlar", position: 4 },
    ]);
    console.log("[setup] default categories created");
  }

  const [{ n: adminCount }] = await db.select({ n: count() }).from(admins);
  if (adminCount === 0) {
    const weak = env.adminPassword.length < 10 || /change-?me|password|12345/i.test(env.adminPassword);
    if (env.adminEmail && env.adminPassword && weak) {
      console.error("[setup] ADMIN_PASSWORD is too weak (10+ characters, not a placeholder). First admin not created.");
    } else if (env.adminEmail && env.adminPassword) {
      await db.insert(admins).values({
        email: env.adminEmail,
        name: env.adminName,
        passwordHash: await bcrypt.hash(env.adminPassword, 12),
      });
      console.log(`[setup] first admin created: ${env.adminEmail}`);
    } else {
      console.warn("[setup] no admins yet — set ADMIN_EMAIL and ADMIN_PASSWORD and restart");
    }
  }

  if (env.seedDemo) {
    const [{ n: productCount }] = await db.select({ n: count() }).from(products);
    if (productCount === 0) await seedDemoProducts();
  }
}

const ICONS = {
  helmet: "M8 32c0-10.5 7.2-19 16-19s16 8.5 16 19v3H8z M8 35h32 M20 13.6c-2.4 4.6-3.4 10.6-3 18.4 M40 26H28v9",
  gloves: "M15 40V23c0-1.7 1.1-3 2.5-3s2.5 1.3 2.5 3v-10c0-1.7 1.1-3 2.5-3s2.5 1.3 2.5 3v-1c0-1.7 1.1-3 2.5-3s2.5 1.3 2.5 3v2c0-1.7 1.1-3 2.5-3s2.5 1.3 2.5 3v14c0 6-4.5 10-10 10z M13 40h20v5H13z",
  bag: "M10 16h28v25H10z M10 23h28 M18 16v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4 M19 31h10",
  rain: "M18 8l-8 6v26h8V24 M30 8l8 6v26h-8V24 M18 8c1.8 2.6 3.8 4 6 4s4.2-1.4 6-4 M18 24h12v16H18z M24 12v28",
  mask: "M14 21c0-8.3 4.5-13 10-13s10 4.7 10 13v11c0 5-4.5 8-10 8s-10-3-10-8z M17 20h14v6H17z",
  vest: "M17 8l-7 6v26h28V14l-7-6-4 7h-6z M10 27h28 M10 33h28 M24 15v25",
  holder: "M17 7h14a2 2 0 0 1 2 2v24a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z M22 31h4 M11 13v16 M37 13v16 M24 35v6 M15 41h18",
  lock: "M15 24v-8a9 9 0 0 1 18 0v8 M11 24h10v16H11z M27 24h10v16H27z M11 30h10 M27 30h10",
  pads: "M22 8a16 16 0 1 0 0 32a16 16 0 1 0 0-32z M22 19a5 5 0 1 0 0 10a5 5 0 1 0 0-10z M34 9l6 4-4 12-6-2z",
  mirror: "M14 8h16a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6v-5a6 6 0 0 1 6-6z M25 25l3 15 M22 41h12",
};

type Demo = {
  icon: keyof typeof ICONS;
  sku: string;
  slug: string;
  name: string;
  cat: string;
  price: number;
  oldPrice?: number;
  stock: StockLevel;
  badge: Badge;
  sizes?: SizeOption[];
  description: string;
  specs: { k: string; v: string }[];
};

const DEMO: Demo[] = [
  { icon: "helmet", sku: "WP-012", slug: "wolter-city-shlemi", name: "Wolter City shlemi", cat: "xavfsizlik", price: 289000, stock: "in", badge: "hit",
    sizes: [{ label: "S", stock: "in" }, { label: "M", stock: "in" }, { label: "L", stock: "low" }, { label: "XL", stock: "out" }],
    description: "Yengil, shamollatiladigan, ichki astari yechib yuviladi. Kun bo‘yi smena uchun.",
    specs: [{ k: "Material", v: "ABS korpus, EPS qatlam" }, { k: "O‘lchamlar", v: "S, M, L, XL" }] },
  { icon: "gloves", sku: "WP-014", slug: "grip-pro-qolqoplari", name: "Grip Pro qo‘lqoplari", cat: "xavfsizlik", price: 119000, stock: "in", badge: "new",
    sizes: [{ label: "M", stock: "in" }, { label: "L", stock: "in" }, { label: "XL", stock: "in" }],
    description: "Sensorli barmoq uchlari — telefonni qo‘lqop yechmasdan ishlatasiz.",
    specs: [{ k: "Material", v: "Sun’iy charm, mesh" }] },
  { icon: "bag", sku: "WP-031", slug: "termo-sumka-42-l", name: "Termo-sumka 42 L", cat: "kuryer-jihozlari", price: 249000, oldPrice: 279000, stock: "low", badge: "sale",
    description: "Issiq va sovuqni saqlaydi, suv o‘tkazmaydi, reflektor chiziqli.",
    specs: [{ k: "Hajmi", v: "42 litr" }, { k: "O‘lchami", v: "42 × 33 × 33 sm" }] },
  { icon: "rain", sku: "WP-033", slug: "yomgirposh-toplami", name: "Yomg‘irpo‘sh to‘plami", cat: "kuryer-jihozlari", price: 179000, stock: "in", badge: "",
    sizes: [{ label: "M", stock: "in" }, { label: "L", stock: "in" }, { label: "XL", stock: "in" }],
    description: "Kurtka va shim, yopishqoq tikuvlar. Kichik sumkaga sig‘adi.",
    specs: [{ k: "To‘plamda", v: "Kurtka, shim, sumkacha" }] },
  { icon: "mask", sku: "WP-017", slug: "balaklava-yuz-niqobi", name: "Balaklava, yuz niqobi", cat: "xavfsizlik", price: 49000, stock: "in", badge: "",
    description: "Shamol va changdan himoya, shlem ostida qulay.",
    specs: [{ k: "Material", v: "Polyester, elastan" }] },
  { icon: "vest", sku: "WP-016", slug: "reflektor-jilet", name: "Reflektor jilet", cat: "xavfsizlik", price: 59000, stock: "low", badge: "",
    description: "Kechasi uzoqdan ko‘rinadi. Kurtka ustidan kiyiladi.",
    specs: [{ k: "O‘lcham", v: "Bitta o‘lcham" }] },
  { icon: "holder", sku: "WP-045", slug: "telefon-ushlagich", name: "Telefon ushlagich", cat: "aksessuarlar", price: 89000, stock: "in", badge: "",
    description: "Rulga mahkam o‘rnatiladi, 4.7–6.8 dyuymli telefonlar uchun.",
    specs: [{ k: "Mos telefonlar", v: "4.7–6.8 dyuym" }] },
  { icon: "lock", sku: "WP-048", slug: "u-qulf-18-mm", name: "U-qulf 18 mm", cat: "aksessuarlar", price: 159000, stock: "out", badge: "",
    description: "Qotirilgan po‘lat, 2 ta kalit bilan.",
    specs: [{ k: "Qalinligi", v: "18 mm" }] },
  { icon: "pads", sku: "WP-061", slug: "tormoz-kolodkalari-juft", name: "Tormoz kolodkalari, juft", cat: "ehtiyot-qismlar", price: 69000, stock: "in", badge: "",
    description: "Wolter e-velosipedlari uchun disk tormoz kolodkalari.",
    specs: [{ k: "To‘plamda", v: "2 dona" }] },
  { icon: "mirror", sku: "WP-063", slug: "yon-oynalar-juft", name: "Yon oynalar, juft", cat: "ehtiyot-qismlar", price: 79000, stock: "in", badge: "",
    description: "Rul uchiga o‘rnatiladi, burchagi sozlanadi.",
    specs: [{ k: "To‘plamda", v: "2 dona" }] },
];

async function seedDemoProducts(): Promise<void> {
  const db = getDb();
  const cats = await db.select().from(categories);
  const bySlug = new Map(cats.map((c) => [c.slug, c.id]));
  let position = 1;
  for (const d of DEMO) {
    const image = await saveIconImage(ICONS[d.icon]);
    await db.insert(products).values({
      sku: d.sku,
      slug: d.slug,
      name: d.name,
      description: d.description,
      categoryId: bySlug.get(d.cat) ?? null,
      price: d.price,
      oldPrice: d.oldPrice ?? null,
      stock: d.stock,
      badge: d.badge,
      sizes: d.sizes ?? [],
      specs: d.specs,
      images: [image],
      position: position++,
    });
  }
  console.log(`[setup] ${DEMO.length} demo products created`);
}
