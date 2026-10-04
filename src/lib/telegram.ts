import { moneyPlain } from "./format";

/** The part of the settings that decides where «Sotib olish» goes. Safe to send to the browser. */
export type BuyTarget = {
  mode: "manager" | "bot";
  manager: string; // username without @
  bot: string; // username without @
  template: string;
  host: string; // "parts.wolter.uz"
};

export type MessageProduct = { name: string; sku: string; slug: string; price: number };
export type ListLine = MessageProduct & { size: string; qty: number };

export const DEFAULT_TEMPLATE =
  "Assalomu alaykum! Sotib olmoqchiman: {nomi} ({sku}), o‘lcham {o‘lcham} — {narx} so‘m. {havola}";

export const TEMPLATE_TOKENS = ["{nomi}", "{sku}", "{o‘lcham}", "{narx}", "{havola}"];

/** "@wolteruz", "t.me/wolteruz", "https://t.me/wolteruz" → "wolteruz" */
export function cleanUsername(input: string): string {
  return String(input ?? "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^(www\.)?(t\.me|telegram\.me)\//i, "")
    .replace(/^@/, "")
    .replace(/[^A-Za-z0-9_]/g, "");
}

export function chatUrl(username: string): string {
  const u = cleanUsername(username);
  return u ? `https://t.me/${u}` : "https://t.me/wolteruz";
}

const SIZE_TOKEN = /\{o[‘'’ʻ`]?lcham\}/gi;
const SIZE_PHRASE = /[,;]?\s*o[‘'’ʻ`]?lcham:?\s*\{o[‘'’ʻ`]?lcham\}/gi;

/** Fills {nomi} {sku} {o‘lcham} {narx} {havola}. Without a size the "o‘lcham …" phrase is dropped. */
export function fillTemplate(template: string, p: MessageProduct, size: string, host: string): string {
  let text = template || DEFAULT_TEMPLATE;
  if (!size) text = text.replace(SIZE_PHRASE, "");
  return text
    .replace(SIZE_TOKEN, size)
    .replace(/\{nomi\}/gi, p.name)
    .replace(/\{sku\}/gi, p.sku)
    .replace(/\{narx\}/gi, moneyPlain(p.price))
    .replace(/\{havola\}/gi, `${host}/p/${p.slug}`)
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function listMessage(lines: ListLine[]): string {
  let total = 0;
  const rows = lines.map((l, i) => {
    const sum = l.price * l.qty;
    total += sum;
    return `${i + 1}) ${l.name}${l.size ? `, ${l.size}` : ""} × ${l.qty} — ${moneyPlain(sum)}`;
  });
  return `Assalomu alaykum! Buyurtma:\n${rows.join("\n")}\nJami: ${moneyPlain(total)} so‘m`;
}

/** Telegram allows up to 64 characters of A–Z, a–z, 0–9, _ and - in ?start= */
export function startParam(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
}

/** Link for one product. */
export function singleBuyUrl(t: BuyTarget, p: MessageProduct, size: string): string {
  if (t.mode === "bot" && cleanUsername(t.bot)) {
    const param = startParam(`p_${p.sku}${size ? `_${size}` : ""}`);
    return `https://t.me/${cleanUsername(t.bot)}?start=${param}`;
  }
  const text = fillTemplate(t.template, p, size, t.host);
  return `${chatUrl(t.manager)}?text=${encodeURIComponent(text)}`;
}

/** Link for a whole Ro‘yxat. In bot mode the list is saved first by /go/list. */
export function listBuyUrl(t: BuyTarget, lines: ListLine[], ids: { id: number; size: string; qty: number }[]): string {
  if (t.mode === "bot" && cleanUsername(t.bot)) {
    const i = ids.map((x) => `${x.id}:${encodeURIComponent(x.size)}:${x.qty}`).join(",");
    return `/go/list?i=${encodeURIComponent(i)}`;
  }
  return `${chatUrl(t.manager)}?text=${encodeURIComponent(listMessage(lines))}`;
}
