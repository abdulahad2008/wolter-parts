"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { money } from "@/lib/format";
import type { ShopProduct } from "@/lib/shop";
import { listBuyUrl, listMessage, type BuyTarget, type ListLine } from "@/lib/telegram";
import { ChevronDown, MinusIcon, PlusIcon, SendIcon, TrashIcon, XIcon } from "../icons";
import { logBuy, MAX_QTY, useList, type ListItem } from "./ListProvider";
import { ProductPhoto } from "./ProductPhoto";

type Row = { item: ListItem; p: ShopProduct; out: boolean };

export function ListView({
  products,
  knownIds,
  target,
  handle,
}: {
  products: ShopProduct[];
  knownIds: number[];
  target: BuyTarget;
  handle: string;
}) {
  const list = useList();
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  // Drop lines whose product was deleted for good. Hidden products stay in the list for later.
  const known = useMemo(() => new Set(knownIds), [knownIds]);
  useEffect(() => {
    if (!list.ready) return;
    for (const it of list.items) if (!known.has(it.id)) list.removeProduct(it.id);
  }, [list, known]);
  const unavailable = list.items.filter((it) => known.has(it.id) && !byId.has(it.id)).length;

  const rows: Row[] = list.items
    .map((item) => {
      const p = byId.get(item.id);
      return p ? { item, p, out: p.stock === "out" || p.sizes.some((s) => s.label === item.size && s.stock === "out") } : null;
    })
    .filter((r): r is Row => r !== null);

  const active = rows.filter((r) => !r.out);
  const lines: ListLine[] = active.map((r) => ({ ...r.p, size: r.item.size, qty: r.item.qty }));
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const noSize = active.filter((r) => r.p.sizes.length > 0 && !r.item.size);
  const message = lines.length ? listMessage(lines) : "";
  const href = lines.length ? listBuyUrl(target, lines, active.map((r) => r.item)) : "#";
  const canSend = lines.length > 0 && noSize.length === 0;

  if (!list.ready) return <div className="min-h-[60vh]" />;

  const unavailableNote =
    unavailable > 0 ? (
      <p className="px-4 pt-3 text-[13px] text-muted md:px-0">{unavailable} ta mahsulot hozir sotuvda yo‘q — xabarga qo‘shilmaydi.</p>
    ) : null;

  if (rows.length === 0) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-[22px] font-extrabold tracking-[-0.03em] md:text-[32px]">Ro‘yxat bo‘sh</h1>
        <p className="text-sm text-muted">Mahsulot kartasidagi «+» tugmasi bilan bir nechta mahsulotni yig‘ib, bitta xabarda yuboring.</p>
        <Link href="/" className="flex h-12 items-center rounded-xl bg-ink px-5 text-sm font-semibold text-white">
          Mahsulotlarni ko‘rish
        </Link>
        {unavailableNote}
      </div>
    );
  }

  const sendCls = "flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] text-base font-bold md:h-14";
  const sendButton = canSend ? (
    <a
      href={href}
      // In bot mode /go/list records the list itself.
      onClick={() => (target.mode === "bot" && target.bot ? undefined : logBuy("list", active.map((r) => r.item)))}
      className={`${sendCls} bg-ink text-white hover:bg-[#2a2929]`}>
      <SendIcon size={18} className="text-lime" />
      Telegram orqali buyurtma berish
    </a>
  ) : (
    <button type="button" disabled className={`${sendCls} cursor-not-allowed bg-[#C9C9C3] text-white`}>
      <SendIcon size={18} />
      Telegram orqali buyurtma berish
    </button>
  );

  return (
    <div className="pb-32 md:mx-auto md:max-w-[1080px] md:px-[clamp(16px,4vw,48px)] md:pt-8 md:pb-0">
      <div className="flex h-[60px] items-center justify-between pr-2 pl-4 md:h-auto md:flex-wrap md:items-baseline md:gap-4 md:p-0">
        <div className="flex items-baseline gap-2 md:gap-2.5">
          <h1 className="text-[22px] font-extrabold tracking-[-0.03em] md:text-[32px] md:tracking-[-0.035em]">Ro‘yxat</h1>
          <span className="text-sm text-muted md:text-base">
            {rows.length} ta<span className="hidden md:inline"> mahsulot</span>
          </span>
        </div>
        <button type="button" onClick={list.clear} className="h-11 px-2.5 text-sm font-semibold text-muted md:hidden">
          Tozalash
        </button>
        <Link href="/" className="hidden text-[15px] font-medium text-soft hover:underline md:inline">
          ← Xaridni davom ettirish
        </Link>
      </div>

      <div className="md:mt-6 md:flex md:flex-wrap md:items-start md:gap-8">
        <div className="flex min-w-0 flex-col px-4 md:flex-[1.6_1_460px] md:border-t md:border-line md:px-0">
          {rows.map((r) => (
            <ListRow key={`${r.item.id}:${r.item.size}`} row={r} />
          ))}
          {unavailableNote}
          <button
            type="button"
            onClick={list.clear}
            className="mt-3 hidden h-11 self-start rounded-xl px-3 text-sm font-semibold text-muted hover:bg-tile md:block"
          >
            Ro‘yxatni tozalash
          </button>
        </div>

        <aside className="flex flex-col px-4 md:flex-[1_1_320px] md:gap-4 md:rounded-[22px] md:bg-[#F7F7F3] md:p-6">
          <div className="flex items-baseline justify-between pt-4 pb-1.5 md:p-0">
            <span className="text-base font-bold md:text-[17px]">Jami</span>
            <span className="text-[22px] font-extrabold tracking-[-0.03em] md:text-[28px]">{money(total)} so‘m</span>
          </div>
          <span className="text-[13px] text-muted md:text-sm">Sotib olish va to‘lov — Telegram chatda kelishiladi.</span>
          {noSize.length > 0 && (
            <p role="alert" className="mt-3 rounded-xl bg-[#FFF1DF] px-3 py-2.5 text-[13px] font-medium text-[#7A4100] md:mt-0">
              O‘lchamni tanlang: {noSize.map((r) => r.p.name).join(", ")}
            </p>
          )}
          {message && (
            <div className="flex flex-col gap-1.5 pt-4 md:pt-0">
              <span className="text-[13px] font-semibold text-soft">
                {target.mode === "bot" && target.bot ? `Bot orqali yuboriladi · @${target.bot}` : `Telegram’ga shu xabar ketadi · ${handle}`}
              </span>
              <div className="rounded-[14px_14px_14px_4px] bg-tile px-3.5 py-3 text-[13px] leading-normal whitespace-pre-line text-[#26261F] md:bg-white">
                {message}
              </div>
            </div>
          )}
          <div className="hidden md:block">{sendButton}</div>
        </aside>
      </div>

      <div className="pb-safe fixed right-0 bottom-0 left-0 z-30 border-t border-line bg-white px-4 pt-3 md:hidden">{sendButton}</div>
    </div>
  );
}

function ListRow({ row }: { row: Row }) {
  const list = useList();
  const { item, p, out } = row;
  const line = p.price * item.qty;
  const sizes = p.sizes;

  const sizeControl =
    sizes.length > 0 ? (
      <label className={`relative inline-flex w-fit items-center gap-1 text-xs md:text-sm ${item.size ? "text-muted" : "font-semibold text-[#A12C1F]"}`}>
        {item.size ? `O‘lcham: ${item.size}` : "O‘lchamni tanlang"}
        <ChevronDown size={12} strokeWidth={2.6} />
        <select
          aria-label={`${p.name} o‘lchami`}
          value={item.size}
          onChange={(e) => list.setSize(item.id, item.size, e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          <option value="" disabled>
            O‘lchamni tanlang
          </option>
          {sizes.map((s) => (
            <option key={s.label} value={s.label} disabled={s.stock === "out"}>
              {s.label}
              {s.stock === "out" ? " — tugagan" : ""}
            </option>
          ))}
        </select>
      </label>
    ) : (
      <span className="text-xs text-muted md:text-sm">Bitta o‘lcham</span>
    );

  return (
    <article className={`flex items-center gap-3 border-b border-line py-3 md:gap-[18px] md:py-[18px] ${out ? "opacity-60" : ""}`}>
      <Link href={`/p/${p.slug}`} aria-label={p.name} className="w-[68px] flex-none overflow-hidden rounded-[14px] md:w-24 md:rounded-2xl">
        <ProductPhoto image={p.images[0]} alt="" sizes="96px" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 md:gap-1">
        <Link href={`/p/${p.slug}`} className="text-sm leading-tight font-medium no-underline md:text-base md:font-semibold">
          {p.name}
        </Link>
        <span className="flex flex-wrap items-center gap-x-1.5">
          {sizeControl}
          <span className="hidden text-sm text-muted md:inline">· {money(p.price)} so‘m</span>
        </span>
        {out ? (
          <span className="text-[13px] font-semibold text-muted">Tugagan — xabarga qo‘shilmaydi</span>
        ) : (
          <span className="text-[15px] font-extrabold tracking-[-0.02em] md:hidden">{money(line)} so‘m</span>
        )}
      </div>
      <div className="flex flex-none items-center rounded-xl bg-tile">
        <button
          type="button"
          aria-label={item.qty === 1 ? "Olib tashlash" : "Kamaytirish"}
          onClick={() => (item.qty === 1 ? list.remove(item.id, item.size) : list.setQty(item.id, item.size, item.qty - 1))}
          className="flex h-11 w-10 items-center justify-center md:w-11"
        >
          {item.qty === 1 ? <TrashIcon size={16} strokeWidth={2} /> : <MinusIcon size={16} strokeWidth={2.4} />}
        </button>
        <span className="min-w-[18px] text-center text-[15px] font-bold md:min-w-[22px] md:text-base">{item.qty}</span>
        <button
          type="button"
          aria-label="Ko‘paytirish"
          disabled={item.qty >= MAX_QTY}
          onClick={() => list.setQty(item.id, item.size, item.qty + 1)}
          className="flex h-11 w-10 items-center justify-center disabled:opacity-30 md:w-11"
        >
          <PlusIcon size={16} strokeWidth={2.4} />
        </button>
      </div>
      <span className="hidden w-[120px] flex-none text-right text-[17px] font-extrabold tracking-[-0.02em] md:block">
        {out ? "—" : `${money(line)} so‘m`}
      </span>
      <button
        type="button"
        aria-label="O‘chirish"
        onClick={() => list.remove(item.id, item.size)}
        className="hidden size-11 flex-none items-center justify-center text-muted hover:text-ink md:flex"
      >
        <XIcon size={18} strokeWidth={2.2} />
      </button>
    </article>
  );
}
