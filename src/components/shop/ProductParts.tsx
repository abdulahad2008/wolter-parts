"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { badgeText } from "@/lib/format";
import type { ShopProduct } from "@/lib/shop";
import { singleBuyUrl, type BuyTarget } from "@/lib/telegram";
import { CheckIcon, PlusIcon, SendIcon, ShareIcon } from "../icons";
import { logBuy, useList } from "./ListProvider";
import { ProductPhoto } from "./ProductPhoto";

export function Gallery({ p }: { p: ShopProduct }) {
  const [active, setActive] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const images = p.images.length ? p.images : [undefined];
  const badge = badgeText(p.badge, p.price, p.oldPrice);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="relative mx-4 overflow-hidden rounded-[18px] md:mx-0 md:rounded-[22px]">
        {/* Phone: swipe between photos */}
        <div
          ref={strip}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto md:hidden"
          onScroll={(e) => {
            const el = e.currentTarget;
            setActive(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {images.map((img, i) => (
            <div key={img?.key ?? i} className="w-full flex-none snap-center">
              <ProductPhoto image={img} alt={i === 0 ? p.name : `${p.name}, ${i + 1}-rasm`} sizes="100vw" priority={i === 0} />
            </div>
          ))}
        </div>
        {/* Computer: one large photo */}
        <div className="hidden md:block">
          <ProductPhoto image={images[active]} alt={p.name} sizes="(min-width: 1280px) 640px, 55vw" priority />
        </div>
        {badge && (
          <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-lime px-2.5 py-1 text-xs font-bold md:top-[18px] md:left-[18px] md:px-3 md:py-[5px] md:text-[13px]">
            {badge}
          </span>
        )}
        {images.length > 1 && (
          <div className="absolute right-0 bottom-3 left-0 flex justify-center gap-1.5 md:hidden">
            {images.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full ${i === active ? "w-5 bg-ink" : "w-1.5 bg-[#C2C2BB]"}`} />
            ))}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="hidden grid-cols-4 gap-3 md:grid">
          {images.map((img, i) => (
            <button
              key={img?.key ?? i}
              type="button"
              aria-label={`${i + 1}-rasm`}
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              className={`overflow-hidden rounded-[14px] border-2 ${i === active ? "border-ink" : "border-transparent"}`}
            >
              <ProductPhoto image={img} alt="" sizes="120px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ShareButton({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label="Havolani ulashish"
      onClick={async () => {
        const url = window.location.href;
        try {
          if (navigator.share) {
            await navigator.share({ title: name, url });
            return;
          }
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* user closed the share sheet */
        }
      }}
      className="relative flex size-11 items-center justify-center"
    >
      {copied ? <CheckIcon size={19} /> : <ShareIcon size={19} />}
      {copied && (
        <span role="status" className="absolute top-11 right-0 rounded-lg bg-ink px-2 py-1 text-xs whitespace-nowrap text-white">
          Havola nusxalandi
        </span>
      )}
    </button>
  );
}

/** Size picker plus «Ro‘yxatga» and «Sotib olish». On phones the two buttons stick to the bottom of the screen. */
export function BuyBox({ p, target, chatUrl }: { p: ShopProduct; target: BuyTarget; chatUrl: string }) {
  const list = useList();
  const sizes = p.sizes;
  const onlyOne = sizes.filter((s) => s.stock !== "out");
  const [size, setSize] = useState(onlyOne.length === 1 && sizes.length === 1 ? onlyOne[0].label : "");
  const [needSize, setNeedSize] = useState(false);
  const sizesRef = useRef<HTMLDivElement>(null);
  const out = p.stock === "out";
  const missingSize = sizes.length > 0 && !size;
  const added = list.ready && list.items.some((x) => x.id === p.id && x.size === size);

  const askSize = () => {
    setNeedSize(true);
    sizesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const buyHref = singleBuyUrl(target, p, size);
  const askHref = `${chatUrl}?text=${encodeURIComponent(`Assalomu alaykum! ${p.name} (${p.sku}) qachon bo‘ladi?`)}`;

  return (
    <>
      {sizes.length > 0 && (
        <div ref={sizesRef} className="flex flex-col gap-2.5 md:border-t md:border-line md:pt-[18px]">
          <span className={`text-sm font-semibold md:text-[15px] ${needSize && !size ? "text-[#A12C1F]" : ""}`}>
            {size ? `O‘lcham: ${size}` : needSize ? "Avval o‘lchamni tanlang" : "O‘lchamni tanlang"}
          </span>
          <div className="flex flex-wrap gap-2 md:gap-2.5">
            {sizes.map((s) => {
              const on = s.label === size;
              const disabled = s.stock === "out";
              return (
                <button
                  key={s.label}
                  type="button"
                  aria-pressed={on}
                  disabled={disabled}
                  onClick={() => {
                    setSize(s.label);
                    setNeedSize(false);
                  }}
                  title={disabled ? "Tugagan" : s.stock === "low" ? "Kam qoldi" : undefined}
                  className={`h-[46px] min-w-14 flex-1 rounded-xl px-3 text-[15px] md:h-12 md:w-[72px] md:flex-none ${
                    on
                      ? "border-[1.5px] border-ink bg-ink font-bold text-white"
                      : disabled
                        ? "bg-tile font-semibold text-faint line-through"
                        : "bg-tile font-semibold hover:bg-[#e8e8e2]"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="pb-safe fixed right-0 bottom-0 left-0 z-30 flex gap-2.5 border-t border-line bg-white px-4 pt-3 md:static md:z-auto md:flex-wrap md:border-0 md:bg-transparent md:p-0">
        {out ? (
          <>
            <span className="flex h-[54px] flex-1 items-center justify-center rounded-[14px] bg-tile text-[15px] font-bold text-muted md:h-14 md:flex-[1_1_160px]">
              Tugagan
            </span>
            <a
              href={askHref}
              className="flex h-[54px] flex-[1.3] items-center justify-center gap-2 rounded-[14px] bg-ink text-[15px] font-bold text-white md:h-14 md:flex-[1.4_1_220px] md:text-base"
            >
              <SendIcon size={17} className="text-lime" />
              Telegram’da so‘rash
            </a>
          </>
        ) : (
          <>
            {added ? (
              <Link
                href="/royxat"
                className="order-1 flex h-[54px] flex-1 items-center justify-center gap-1.5 rounded-[14px] bg-lime text-[15px] font-bold md:order-2 md:h-14 md:flex-[1_1_160px] md:text-base"
              >
                <CheckIcon size={17} strokeWidth={2.4} />
                Ro‘yxatda
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => (missingSize ? askSize() : list.add(p.id, size))}
                className="order-1 flex h-[54px] flex-1 items-center justify-center gap-1.5 rounded-[14px] bg-tile text-[15px] font-bold hover:bg-[#e8e8e2] md:order-2 md:h-14 md:flex-[1_1_160px] md:text-base"
              >
                <PlusIcon size={17} strokeWidth={2.2} />
                Ro‘yxatga
              </button>
            )}
            <a
              href={buyHref}
              onClick={(e) => {
                if (missingSize) {
                  e.preventDefault();
                  askSize();
                  return;
                }
                logBuy("single", [{ id: p.id, size, qty: 1 }]);
              }}
              className="order-2 flex h-[54px] flex-[1.3] items-center justify-center gap-2 rounded-[14px] bg-ink text-[15px] font-bold text-white hover:bg-[#2a2929] md:order-1 md:h-14 md:flex-[1.4_1_220px] md:text-base"
            >
              <SendIcon size={17} className="text-lime" />
              Sotib olish
            </a>
          </>
        )}
      </div>
      <span className="hidden text-[13px] leading-normal text-muted md:block">
        «Sotib olish» bosilganda Telegram ochiladi — xabar tayyor holda yozilgan bo‘ladi.
      </span>
    </>
  );
}
