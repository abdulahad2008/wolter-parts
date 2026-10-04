import { randomBytes } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { allow, clientIp } from "@/lib/rate";
import { buyClicks, products } from "@/lib/schema";
import { getSettings } from "@/lib/shop";
import { chatUrl, cleanUsername, startParam } from "@/lib/telegram";

function decode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return "";
  }
}

/**
 * Bot mode only: saves a Ro‘yxat and opens the bot with ?start=c_<id>,
 * so the bot can read the list from the buy_clicks table (group_id).
 */
export async function GET(req: Request) {
  const settings = await getSettings();
  const bot = cleanUsername(settings.tgBot);
  const raw = (new URL(req.url).searchParams.get("i") ?? "").slice(0, 2000);
  const parsed = raw
    .split(",")
    .map((part) => {
      const [id, size, qty] = part.split(":");
      return { id: Number(id), size: decode(size ?? "").slice(0, 20), qty: Math.min(99, Math.max(1, Number(qty) || 1)) };
    })
    .filter((x) => Number.isInteger(x.id) && x.id > 0);
  const items = parsed.filter((it, i, all) => all.findIndex((x) => x.id === it.id && x.size === it.size) === i).slice(0, 30);

  if (settings.tgMode !== "bot" || !bot || items.length === 0) {
    return Response.redirect(chatUrl(settings.tgManager), 302);
  }
  if (!allow(`golist:${await clientIp()}`, 10, 60_000)) {
    return Response.redirect(`https://t.me/${bot}`, 302);
  }

  const db = getDb();
  const found = await db
    .select({ id: products.id, sku: products.sku })
    .from(products)
    .where(and(inArray(products.id, items.map((i) => i.id)), eq(products.visible, true), eq(products.archived, false)));
  const sku = new Map(found.map((p) => [p.id, p.sku]));
  const rows = items.filter((i) => sku.has(i.id));
  if (rows.length === 0) return Response.redirect(`https://t.me/${bot}`, 302);
  const groupId = randomBytes(6).toString("hex");
  await db
    .insert(buyClicks)
    .values(rows.map((i) => ({ productId: i.id, sku: sku.get(i.id)!, size: i.size, qty: i.qty, kind: "list" as const, groupId })));
  return Response.redirect(`https://t.me/${bot}?start=${startParam(`c_${groupId}`)}`, 302);
}
