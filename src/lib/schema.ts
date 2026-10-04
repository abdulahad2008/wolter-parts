import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type StockLevel = "in" | "low" | "out";
export type Badge = "" | "new" | "hit" | "sale";
export type SizeOption = { label: string; stock: StockLevel };
export type Spec = { k: string; v: string };
export type ProductImage = { key: string; w: number; h: number };

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  position: integer("position").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    sku: text("sku").notNull().unique(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    nameRu: text("name_ru").notNull().default(""),
    description: text("description").notNull().default(""),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    price: integer("price").notNull(),
    oldPrice: integer("old_price"),
    stock: text("stock").$type<StockLevel>().notNull().default("in"),
    badge: text("badge").$type<Badge>().notNull().default(""),
    sizes: jsonb("sizes").$type<SizeOption[]>().notNull().default([]),
    specs: jsonb("specs").$type<Spec[]>().notNull().default([]),
    images: jsonb("images").$type<ProductImage[]>().notNull().default([]),
    visible: boolean("visible").notNull().default(true),
    archived: boolean("archived").notNull().default(false),
    // Order on the site: 1, 2, 3… Drag-and-drop in the admin renumbers it.
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("products_position_idx").on(t.position)],
);

/** One row only (id = 1). */
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  tgMode: text("tg_mode").$type<"manager" | "bot">().notNull().default("manager"),
  tgManager: text("tg_manager").notNull().default("wolteruz"),
  tgBot: text("tg_bot").notNull().default(""),
  template: text("template").notNull(),
  address: text("address").notNull().default(""),
  landmark: text("landmark").notNull().default(""),
  hours: text("hours").notNull().default(""),
  phone: text("phone").notNull().default(""),
  mapUrl: text("map_url").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  // Bumped when the password changes; older login cookies stop working.
  sessionVersion: integer("session_version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

/** Every tap on «Sotib olish» (one row per product; a Ro‘yxat shares a group id). */
export const buyClicks = pgTable(
  "buy_clicks",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    sku: text("sku").notNull(),
    size: text("size").notNull().default(""),
    qty: integer("qty").notNull().default(1),
    kind: text("kind").$type<"single" | "list">().notNull(),
    groupId: text("group_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("buy_clicks_created_idx").on(t.createdAt),
    index("buy_clicks_product_idx").on(t.productId),
    index("buy_clicks_group_idx").on(t.groupId),
  ],
);

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Admin = typeof admins.$inferSelect;
