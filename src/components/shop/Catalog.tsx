"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { badgeText, money } from "@/lib/format";
import type { ShopCategory, ShopProduct } from "@/lib/shop";
import { ArrowRight, CheckIcon, ChevronDown, PlusIcon, SearchIcon } from "../icons";
import { setUrlParam } from "./Header";
import { useList } from "./ListProvider";
import { ProductPhoto } from "./ProductPhoto";

const SORTS = [
  { id: "", label: "Tartib: tavsiya" },
  { id: "arzon", label: "Arzonidan" },
  { id: "qimmat", label: "Qimmatidan" },
  { id: "yangi", label: "Yangilari" },
];

const fold = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’ʻʼ'`]/g, "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");

export function Catalog({ products, categories }: { products: ShopProduct[]; categories: ShopCategory[] }) {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const cat = params.get("c") ?? "";
  const sort = params.get("sort") ?? "";
  const list = useList();

  const activeCat = categories.find((c) => c.slug === cat);

  const shown = useMemo(() => {
    const needle = fold(q.trim());
    let rows = products.filter((p) => {
      if (activeCat && p.categoryId !== activeCat.id) return false;
      if (!needle) return true;
      return fold(`${p.name} ${p.sku} ${p.description}`).includes(needle);
    });
    if (sort === "arzon") rows = [...rows].sort((a, b) => a.price - b.price);
    if (sort === "qimmat") rows = [...rows].sort((a, b) => b.price - a.price);
    if (sort === "yangi") rows = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return rows;
  }, [products, activeCat, q, sort]);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const listTotal = list.items.reduce((sum, it) => {
    const p = byId.get(it.id);
    return p && p.stock !== "out" ? sum + p.price * it.qty : sum;
  }, 0);

  const chips = [{ slug: "", name: "Barchasi" }, ...categories];

  return (
    <>
      {/* Phone search */}
      <div className="px-4 pt-1 pb-3 md:hidden">
        <label className="flex h-12 items-center gap-2.5 rounded-[14px] bg-tile px-3.5">
          <SearchIcon size={19} strokeWidth={1.9} className="text-muted" />
          <SearchInput q={q} />
        </label>
      </div>

      <div className="md:mx-auto md:flex md:max-w-[1280px] md:flex-col md:gap-5 md:px-[clamp(16px,4vw,48px)] md:pt-6">
        <div className="md:flex md:flex-wrap md:items-center md:justify-between md:gap-4">
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 md:flex-wrap md:overflow-visible md:px-0">
            {chips.map((c) => {
              const on = c.slug === (activeCat?.slug ?? "");
              return (
                <button
                  key={c.slug || "all"}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setUrlParam("c", c.slug)}
                  className={`h-[38px] flex-none rounded-full px-3.5 text-sm md:h-10 md:px-4 ${
                    on ? "bg-ink font-semibold text-white" : "bg-tile font-medium hover:bg-[#e8e8e2]"
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2.5 pr-2 pb-1 pl-4 md:gap-3.5 md:p-0 md:text-sm">
            <span className="text-[13px] text-muted md:text-sm">{shown.length} ta mahsulot</span>
            <label className="relative flex h-11 items-center gap-1.5 px-2 text-[13px] font-semibold md:h-10 md:rounded-[10px] md:bg-tile md:px-3 md:text-sm md:font-medium">
              <span>{SORTS.find((s) => s.id === sort)?.label ?? SORTS[0].label}</span>
              <ChevronDown size={14} strokeWidth={2.4} />
              <select
                aria-label="Saralash"
                value={sort}
                onChange={(e) => setUrlParam("sort", e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {products.length === 0 ? (
          <p className="px-4 py-16 text-center text-muted md:px-0">Tez orada mahsulotlar qo‘shiladi.</p>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center md:px-0">
            <p className="text-muted">Hech narsa topilmadi.</p>
            <button
              type="button"
              onClick={() => {
                setUrlParam("q", "");
                setUrlParam("c", "");
              }}
              className="h-11 rounded-xl bg-tile px-4 text-sm font-semibold"
            >
              Hammasini ko‘rsatish
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 px-4 md:grid-cols-[repeat(auto-fill,minmax(min(210px,100%),1fr))] md:gap-x-5 md:gap-y-8 md:px-0">
            {shown.map((p, i) => (
              <ProductCard
                key={p.id}
                p={p}
                priority={i < 4}
                inList={list.ready && list.has(p.id)}
                onToggle={() => (list.has(p.id) ? list.removeProduct(p.id) : list.add(p.id))}
              />
            ))}
          </div>
        )}
      </div>

      {list.ready && list.count > 0 && (
        <Link
          href="/royxat"
          className="fixed right-3 bottom-[max(16px,env(safe-area-inset-bottom))] left-3 z-30 flex h-[62px] items-center justify-between rounded-2xl bg-ink pr-[9px] pl-4 text-white shadow-[0_10px_30px_rgba(15,14,14,0.25)] md:hidden"
        >
          <span className="flex flex-col gap-px">
            <span className="text-xs text-[#BDBDB7]">Ro‘yxatda {list.count} ta</span>
            <span className="text-base font-extrabold tracking-[-0.02em]">{money(listTotal)} so‘m</span>
          </span>
          <span className="flex h-11 items-center gap-1.5 rounded-[11px] bg-lime px-3.5 text-sm font-bold text-ink">
            Ro‘yxatni ko‘rish
            <ArrowRight size={16} strokeWidth={2.4} />
          </span>
        </Link>
      )}
    </>
  );
}

export function ProductCard({
  p,
  inList,
  onToggle,
  priority,
}: {
  p: ShopProduct;
  inList: boolean;
  onToggle: () => void;
  priority?: boolean;
}) {
  const out = p.stock === "out";
  const badge = badgeText(p.badge, p.price, p.oldPrice);
  return (
    <article className={`flex flex-col gap-2 md:gap-2.5 ${out ? "opacity-55" : ""}`}>
      <div className="relative">
        <Link href={`/p/${p.slug}`} aria-label={p.name} className="block overflow-hidden rounded-2xl md:rounded-[18px]">
          <ProductPhoto image={p.images[0]} alt={p.name} priority={priority} className="transition-transform duration-300 hover:scale-[1.03]" />
        </Link>
        {badge && (
          <span className="pointer-events-none absolute top-2 left-2 rounded-full bg-lime px-2 py-1 text-[11px] font-bold md:top-3 md:left-3 md:px-2.5 md:text-xs">
            {badge}
          </span>
        )}
        {!out &&
          (inList ? (
            <button
              type="button"
              aria-label="Ro‘yxatdan olib tashlash"
              aria-pressed="true"
              onClick={onToggle}
              className="absolute right-2 bottom-2 flex size-11 items-center justify-center rounded-full bg-ink text-lime md:right-3 md:bottom-3"
            >
              <CheckIcon size={18} strokeWidth={2.6} />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Ro‘yxatga qo‘shish"
              onClick={onToggle}
              className="absolute right-2 bottom-2 flex size-11 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(15,14,14,0.12)] md:right-3 md:bottom-3"
            >
              <PlusIcon size={18} strokeWidth={2.2} />
            </button>
          ))}
      </div>
      <Link href={`/p/${p.slug}`} className="min-h-9 text-sm leading-[1.3] font-medium no-underline md:min-h-0 md:text-[15px] md:leading-[1.35]">
        {p.name}
      </Link>
      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 md:gap-x-2">
        <span className="text-[15px] font-extrabold tracking-[-0.02em] md:text-[17px]">{money(p.price)} so‘m</span>
        {p.oldPrice && p.oldPrice > p.price ? (
          <span className="text-xs text-faint line-through md:text-[13px]">{money(p.oldPrice)}</span>
        ) : null}
        {p.stock === "low" && <span className="w-full text-xs font-semibold text-warn md:w-auto md:text-[13px]">Kam qoldi</span>}
        {out && <span className="w-full text-xs font-semibold text-muted md:w-auto md:text-[13px]">Tugagan</span>}
      </div>
    </article>
  );
}

function SearchInput({ q }: { q: string }) {
  const [value, setValue] = useState(q);
  useEffect(() => setValue(q), [q]);
  return (
    <input
      type="search"
      aria-label="Mahsulot qidirish"
      placeholder="Mahsulot qidirish"
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        setUrlParam("q", e.target.value);
      }}
      className="min-w-0 flex-1 border-0 bg-transparent outline-none placeholder:text-muted"
    />
  );
}
