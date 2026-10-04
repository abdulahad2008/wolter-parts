import type { Badge, StockLevel } from "./schema";

/** 289000 → "289 000" (thin non-breaking spaces stay on one line). */
export function money(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Same as money() but with plain spaces, for Telegram messages. */
export function moneyPlain(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export const STOCK_LABEL: Record<StockLevel, string> = {
  in: "Mavjud",
  low: "Kam qoldi",
  out: "Tugagan",
};

export const STOCK_DOT: Record<StockLevel, string> = {
  in: "#2F9E44",
  low: "#E07B00",
  out: "#8A8A84",
};

export const STOCK_CHIP: Record<StockLevel, string> = {
  in: "#EAF6EC",
  low: "#FFF1DF",
  out: "#EFEFEA",
};

/** Text on the lime badge in the corner of a product photo. */
export function badgeText(badge: Badge, price: number, oldPrice: number | null): string {
  if (badge === "new") return "Yangi";
  if (badge === "hit") return "Xit";
  if (badge === "sale") {
    if (oldPrice && oldPrice > price) return `−${Math.round((1 - price / oldPrice) * 100)}%`;
    return "Chegirma";
  }
  return "";
}

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", ғ: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y",
  к: "k", қ: "q", л: "l", м: "m", н: "n", о: "o", ў: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "x", ҳ: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "", э: "e", ю: "yu", я: "ya",
};

/** "Grip Pro qo‘lqoplari" → "grip-pro-qolqoplari" */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[‘’ʻʼ'`]/g, "")
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Digits only: "289 000 so‘m" → 289000; empty → null. */
export function parsePrice(input: string): number | null {
  const digits = String(input ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}
