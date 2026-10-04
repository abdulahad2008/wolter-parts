"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { archiveProduct, duplicateProduct, saveProduct, type ProductInputType } from "@/app/admin/actions";
import { money, parsePrice, slugify, STOCK_DOT, STOCK_LABEL } from "@/lib/format";
import type { Badge, ProductImage, SizeOption, Spec, StockLevel } from "@/lib/schema";
import { cleanUsername, fillTemplate } from "@/lib/telegram";
import { ExternalIcon, PlusIcon, XIcon } from "../icons";
import { cardCls, dangerBtn, inputCls, labelCls, primaryBtn, secondaryBtn, Segmented, Status, Toggle } from "./ui";

export type FormProduct = {
  id?: number;
  updatedAt?: string;
  name: string;
  nameRu: string;
  description: string;
  categoryId: number | null;
  sku: string;
  slug: string;
  price: number | null;
  oldPrice: number | null;
  stock: StockLevel;
  badge: Badge;
  sizes: SizeOption[];
  specs: Spec[];
  images: ProductImage[];
  visible: boolean;
};

type Props = {
  initial: FormProduct;
  categories: { id: number; name: string }[];
  template: string;
  manager: string;
  host: string;
  sitePosition: number | null;
  clicks: { d7: number; d30: number } | null;
  notice?: string;
};

const MAX_PHOTOS = 6;
const NEXT_STOCK: Record<StockLevel, StockLevel> = { in: "low", low: "out", out: "in" };

export function ProductForm({ initial, categories, template, manager, host, sitePosition, clicks, notice }: Props) {
  const [p, setP] = useState<FormProduct>(initial);
  const [priceText, setPriceText] = useState(initial.price ? money(initial.price) : "");
  const [oldText, setOldText] = useState(initial.oldPrice ? money(initial.oldPrice) : "");
  const [dirty, setDirty] = useState(false);
  const [flash, setFlash] = useState<{ text: string; tone: "ok" | "error" } | null>(notice ? { text: notice, tone: "ok" } : null);
  const [errField, setErrField] = useState<string>("");
  const [saving, startSave] = useTransition();
  const [busy, startBusy] = useTransition();
  const [uploading, setUploading] = useState(0);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isNew = !p.id;

  // The saved copy changed (after Save): take it as the new starting point.
  useEffect(() => {
    setP(initial);
    setPriceText(initial.price ? money(initial.price) : "");
    setOldText(initial.oldPrice ? money(initial.oldPrice) : "");
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.id, initial.updatedAt]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function set<K extends keyof FormProduct>(key: K, value: FormProduct[K]) {
    setP((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    if (errField === key) setErrField("");
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const room = MAX_PHOTOS - p.images.length;
    const list = Array.from(files).slice(0, Math.max(0, room));
    if (!list.length) {
      setFlash({ text: `${MAX_PHOTOS} tagacha rasm qo‘shish mumkin.`, tone: "error" });
      return;
    }
    for (const file of list) {
      setUploading((n) => n + 1);
      try {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Yuklab bo‘lmadi.");
        setP((prev) => ({ ...prev, images: [...prev.images, data as ProductImage].slice(0, MAX_PHOTOS) }));
        setDirty(true);
      } catch (err) {
        setFlash({ text: err instanceof Error ? err.message : "Yuklab bo‘lmadi.", tone: "error" });
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function save() {
    const input: ProductInputType = {
      ...p,
      price: parsePrice(priceText) ?? 0,
      oldPrice: parsePrice(oldText),
      specs: p.specs.filter((s) => s.k.trim() || s.v.trim()),
    };
    startSave(async () => {
      const res = await saveProduct(input).catch(() => ({ ok: false as const, error: "Internet aloqasini tekshiring va qayta urinib ko‘ring.", field: "" }));
      if (res.ok) {
        setDirty(false);
        setErrField("");
        setFlash({ text: res.message ?? "Saqlandi", tone: "ok" });
      } else {
        setErrField(res.field ?? "");
        setFlash({ text: res.error, tone: "error" });
        document.getElementById(`f-${res.field}`)?.focus();
      }
    });
  }

  const firstSize = p.sizes.find((s) => s.stock !== "out")?.label ?? "";
  const preview = fillTemplate(
    template,
    { name: p.name || "Mahsulot nomi", sku: p.sku || "WP-000", slug: p.slug || slugify(p.name) || "mahsulot", price: parsePrice(priceText) ?? 0 },
    firstSize,
    host,
  );
  const errCls = (field: string) => (errField === field ? " border-[#A12C1F] ring-2 ring-[#FDECEA]" : "");

  const saveButton = (
    <button type="button" onClick={save} disabled={saving || uploading > 0} className={`${primaryBtn} px-[22px]`}>
      {saving ? "Saqlanmoqda…" : uploading ? "Rasm yuklanmoqda…" : "Saqlash"}
    </button>
  );

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-28 md:gap-5 md:px-[clamp(16px,3vw,40px)] md:pt-6 md:pb-12">
      <div className="flex flex-col gap-2.5">
        <nav aria-label="Joylashuv" className="flex gap-2 text-sm text-muted">
          <Link href="/admin" className="hover:text-ink">Mahsulotlar</Link>
          <span>/</span>
          <span className="truncate text-ink">{isNew ? "Yangi mahsulot" : initial.name}</span>
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-[-0.03em] md:text-[28px]">{isNew ? "Yangi mahsulot" : initial.name}</h1>
            {!isNew && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold" style={{ background: initial.visible ? "#EAF6EC" : "#EFEFEA" }}>
                <span className="size-[7px] rounded-full" style={{ background: initial.visible ? "#2F9E44" : "#8A8A84" }} />
                {initial.visible ? "Saytda" : "Yashirin"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {!isNew && initial.visible && (
              <a href={`/p/${initial.slug}`} target="_blank" rel="noreferrer" className={secondaryBtn}>
                Saytda ko‘rish
                <ExternalIcon size={16} />
              </a>
            )}
            <span className="hidden md:inline-flex">{saveButton}</span>
          </div>
        </div>
        {flash && (
          <div>
            <Status text={flash.text} tone={flash.tone} onDone={() => setFlash(null)} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-start gap-4 md:gap-5">
        <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-4 md:gap-5">
          {/* Photos */}
          <section className={cardCls}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-lg font-bold">Rasmlar</h2>
              <span className="text-[13px] text-muted">{MAX_PHOTOS} tagacha · avtomatik kvadrat WebP qilinadi · sudrab tartiblang</span>
            </div>
            <Photos
              images={p.images}
              uploading={uploading}
              onChange={(images) => set("images", images)}
              onAdd={() => fileRef.current?.click()}
              canAdd={p.images.length + uploading < MAX_PHOTOS}
            />
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
          </section>

          {/* Basics */}
          <section className={cardCls}>
            <h2 className="text-lg font-bold">Asosiy ma’lumotlar</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-4">
              <label className={labelCls}>
                Nomi (o‘zbekcha)
                <input id="f-name" className={inputCls + errCls("name")} value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="Masalan: Wolter City shlemi" />
              </label>
              <label className={`${labelCls} text-faint`}>
                Nomi (ruscha)
                <input disabled placeholder="Keyingi bosqichda" className={`${inputCls} border-dashed bg-panel`} />
              </label>
            </div>
            <label className={labelCls}>
              Qisqa tavsif
              <textarea
                rows={3}
                className={`${inputCls} h-auto resize-y py-3 leading-normal`}
                value={p.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </label>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
              <label className={labelCls}>
                Kategoriya
                <select
                  className={inputCls}
                  value={p.categoryId ?? ""}
                  onChange={(e) => set("categoryId", e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">— Kategoriyasiz —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelCls}>
                SKU
                <input id="f-sku" className={inputCls + errCls("sku")} value={p.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} />
              </label>
              <label className={labelCls}>
                Sahifa manzili
                <span className={`flex h-[46px] items-center overflow-hidden rounded-[10px] border border-field bg-white focus-within:border-ink${errCls("slug")}`}>
                  <span className="pr-1 pl-3 text-[13px] font-normal whitespace-nowrap text-[#77776F]">…/p/</span>
                  <input
                    id="f-slug"
                    className="h-11 min-w-0 flex-1 border-0 pr-3 text-[15px] font-normal outline-none"
                    value={p.slug}
                    placeholder={slugify(p.name) || "avtomatik"}
                    onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  />
                </span>
              </label>
            </div>
          </section>

          {/* Price and stock */}
          <section className={cardCls}>
            <h2 className="text-lg font-bold">Narx va ombor</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-4">
              <label className={labelCls}>
                Narx, so‘m
                <input
                  id="f-price"
                  inputMode="numeric"
                  className={`${inputCls} font-semibold${errCls("price")}`}
                  value={priceText}
                  onChange={(e) => {
                    const n = parsePrice(e.target.value);
                    setPriceText(n === null ? "" : money(n));
                    setDirty(true);
                    if (errField === "price") setErrField("");
                  }}
                />
              </label>
              <label className={labelCls}>
                Eski narx, so‘m
                <input
                  inputMode="numeric"
                  className={inputCls}
                  placeholder="Chegirma bo‘lsa — ustidan chizilib ko‘rinadi"
                  value={oldText}
                  onChange={(e) => {
                    const n = parsePrice(e.target.value);
                    setOldText(n === null ? "" : money(n));
                    setDirty(true);
                  }}
                />
              </label>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold">Ombor holati</span>
              <Segmented
                label="Ombor holati"
                value={p.stock}
                onChange={(v) => set("stock", v)}
                options={[
                  { value: "in", label: "Mavjud" },
                  { value: "low", label: "Kam qoldi" },
                  { value: "out", label: "Tugagan" },
                ]}
              />
            </div>
          </section>

          {/* Sizes */}
          <section className={cardCls}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-lg font-bold">O‘lchamlar</h2>
              <span className="text-[13px] text-muted">O‘lchamni bossangiz holati almashadi: mavjud → kam qoldi → tugagan</span>
            </div>
            <Sizes sizes={p.sizes} onChange={(s) => set("sizes", s)} />
          </section>

          {/* Specs */}
          <section className={cardCls}>
            <h2 className="text-lg font-bold">Xususiyatlar</h2>
            {p.specs.map((s, i) => (
              <div key={i} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_40px] items-center gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_44px] md:gap-2.5">
                <input
                  aria-label="Xususiyat nomi"
                  placeholder="Material"
                  className={`${inputCls} h-11 text-sm font-semibold`}
                  value={s.k}
                  onChange={(e) => set("specs", p.specs.map((x, j) => (j === i ? { ...x, k: e.target.value } : x)))}
                />
                <input
                  aria-label="Qiymati"
                  placeholder="ABS korpus"
                  className={`${inputCls} h-11 text-sm`}
                  value={s.v}
                  onChange={(e) => set("specs", p.specs.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)))}
                />
                <button
                  type="button"
                  aria-label="Qatorni o‘chirish"
                  onClick={() => set("specs", p.specs.filter((_, j) => j !== i))}
                  className="flex size-11 items-center justify-center rounded-[10px] text-muted hover:bg-panel"
                >
                  <XIcon size={16} strokeWidth={2.2} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set("specs", [...p.specs, { k: "", v: "" }])}
              className="h-10 self-start rounded-[10px] border border-dashed border-[#A6A6A0] px-3.5 text-sm font-semibold text-soft"
            >
              + Qator qo‘shish
            </button>
          </section>
        </div>

        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 md:gap-5">
          <section className={`${cardCls} md:p-[22px]`}>
            <h2 className="text-base font-bold">Ko‘rinish</h2>
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-semibold">Saytda ko‘rinadi</span>
                <span className="text-[13px] text-muted">O‘chirsangiz, mahsulot yashiriladi</span>
              </div>
              <Toggle size="lg" on={p.visible} onChange={(v) => set("visible", v)} label="Saytda ko‘rinadi" />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line pt-3.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-semibold">{sitePosition ? `Saytdagi o‘rni: ${sitePosition}` : "Ro‘yxat oxiriga qo‘shiladi"}</span>
                <span className="text-[13px] text-muted">Mahsulotlar ro‘yxatida sudrab o‘zgartiriladi</span>
              </div>
              {sitePosition && (
                <Link href="/admin" className="text-sm font-semibold hover:underline">
                  O‘zgartirish
                </Link>
              )}
            </div>
          </section>

          <section className={`${cardCls} gap-3 md:p-[22px]`}>
            <h2 className="text-base font-bold">Belgi</h2>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["new", "Yangi"],
                  ["hit", "Xit"],
                  ["sale", "Chegirma"],
                ] as const
              ).map(([value, label]) => {
                const on = p.badge === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set("badge", on ? "" : value)}
                    className={`h-10 rounded-full border px-3.5 text-sm ${on ? "border-ink bg-lime font-bold" : "border-field bg-white font-semibold"}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {p.badge === "sale" && !parsePrice(oldText) && (
              <span className="text-[13px] text-muted">Eski narxni yozsangiz, chegirma foizi ko‘rinadi.</span>
            )}
          </section>

          <section className={`${cardCls} gap-3 md:p-[22px]`}>
            <h2 className="text-base font-bold">Telegram xabari</h2>
            <div className="rounded-[14px_14px_14px_4px] bg-[#F1F1EC] px-3.5 py-3 text-sm leading-[1.45] break-words">{preview}</div>
            <span className="text-[13px] leading-[1.45] text-muted">
              Kimga: @{cleanUsername(manager) || "wolteruz"}. Matn Sozlamalardagi umumiy shablondan olinadi.
            </span>
            <Link href="/admin/settings" className="text-sm font-semibold hover:underline">
              Shablonni o‘zgartirish
            </Link>
          </section>

          {clicks && (
            <section className="flex flex-col gap-3 rounded-2xl bg-ink p-[22px] text-white md:rounded-[18px]">
              <h2 className="text-base font-bold">«Sotib olish» bosishlari</h2>
              <div className="flex gap-7">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[28px] font-extrabold text-lime">{clicks.d7}</span>
                  <span className="text-[13px] text-[#BDBDB7]">7 kun</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[28px] font-extrabold">{clicks.d30}</span>
                  <span className="text-[13px] text-[#BDBDB7]">30 kun</span>
                </div>
              </div>
            </section>
          )}

          {!isNew && (
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  startBusy(async () => {
                    const res = await duplicateProduct(p.id!).catch(() => null);
                    if (res && !res.ok) setFlash({ text: res.error, tone: "error" });
                  })
                }
                className={secondaryBtn}
              >
                Nusxa olish
              </button>
              {confirmArchive ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    startBusy(async () => {
                      const res = await archiveProduct(p.id!);
                      if (res.ok) window.location.href = "/admin";
                    })
                  }
                  className={`${dangerBtn} bg-[#FDECEA]`}
                >
                  Ha, arxivga olish
                </button>
              ) : (
                <button type="button" onClick={() => setConfirmArchive(true)} className={dangerBtn}>
                  Arxivlash
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Phone: save bar */}
      <div className="pb-safe fixed right-0 bottom-0 left-0 z-30 border-t border-panel-line bg-white px-4 pt-3 md:hidden">
        <button type="button" onClick={save} disabled={saving || uploading > 0} className={`${primaryBtn} h-[52px] w-full rounded-xl text-base`}>
          {saving ? "Saqlanmoqda…" : uploading ? "Rasm yuklanmoqda…" : "Saqlash"}
        </button>
      </div>
    </div>
  );
}

function Photos({
  images,
  uploading,
  onChange,
  onAdd,
  canAdd,
}: {
  images: ProductImage[];
  uploading: number;
  onChange: (images: ProductImage[]) => void;
  onAdd: () => void;
  canAdd: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const keys = images.map((i) => i.key);
    onChange(arrayMove(images, keys.indexOf(String(e.active.id)), keys.indexOf(String(e.over.id))));
  }
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-3 md:grid-cols-[repeat(auto-fill,minmax(130px,1fr))]">
      <DndContext id="photo-order" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={images.map((i) => i.key)} strategy={rectSortingStrategy}>
          {images.map((img, i) => (
            <PhotoTile
              key={img.key}
              img={img}
              main={i === 0}
              onRemove={() => onChange(images.filter((x) => x.key !== img.key))}
              onMakeMain={() => onChange([img, ...images.filter((x) => x.key !== img.key)])}
            />
          ))}
        </SortableContext>
      </DndContext>
      {Array.from({ length: uploading }).map((_, i) => (
        <div key={`up-${i}`} className="flex aspect-square animate-pulse items-center justify-center rounded-[14px] bg-[#EFEFEA] text-xs text-muted">
          Yuklanmoqda…
        </div>
      ))}
      {canAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-[#A6A6A0] bg-[#FAFAF7] p-2 text-center text-[13px] font-semibold text-soft hover:bg-white"
        >
          <PlusIcon size={24} />
          Rasm qo‘shish
          <span className="text-xs font-normal text-[#77776F]">telefondan ham</span>
        </button>
      )}
    </div>
  );
}

function PhotoTile({ img, main, onRemove, onMakeMain }: { img: ProductImage; main: boolean; onRemove: () => void; onMakeMain: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: img.key });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`group relative aspect-square overflow-hidden rounded-[14px] bg-[#EFEFEA] ${isDragging ? "z-10 shadow-lg" : ""}`}
    >
      <div {...attributes} {...listeners} aria-label={main ? "Asosiy rasm. Sudrab tartiblang" : "Rasm. Sudrab tartiblang"} className="h-full w-full cursor-grab touch-manipulation">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/media/${img.key}-480.webp`} alt="" draggable={false} className="h-full w-full object-cover" />
      </div>
      {main ? (
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-ink px-2 py-[3px] text-[11px] font-bold text-lime">Asosiy</span>
      ) : (
        <button
          type="button"
          onClick={onMakeMain}
          className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-[3px] text-[11px] font-semibold shadow-sm"
        >
          Asosiy qilish
        </button>
      )}
      <button
        type="button"
        aria-label="Rasmni olib tashlash"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white"
      >
        <XIcon size={15} strokeWidth={2.4} />
      </button>
    </div>
  );
}

function Sizes({ sizes, onChange }: { sizes: SizeOption[]; onChange: (s: SizeOption[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  function add() {
    const parts = label
      .split(/[,\s]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    const next = [...sizes];
    for (const part of parts) if (!next.some((s) => s.label.toLowerCase() === part.toLowerCase())) next.push({ label: part.slice(0, 12), stock: "in" });
    onChange(next);
    setLabel("");
    setAdding(false);
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {sizes.map((s) => (
          <span key={s.label} className="flex h-10 items-center gap-1 rounded-[10px] border border-field pl-1 text-sm font-semibold">
            <button
              type="button"
              title={`${STOCK_LABEL[s.stock]} — bosing, almashadi`}
              aria-label={`${s.label}: ${STOCK_LABEL[s.stock]}. Holatini almashtirish`}
              onClick={() => onChange(sizes.map((x) => (x === s ? { ...x, stock: NEXT_STOCK[x.stock] } : x)))}
              className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-panel"
            >
              <span className="size-2 rounded-full" style={{ background: STOCK_DOT[s.stock] }} />
              {s.label}
            </button>
            <button
              type="button"
              aria-label={`${s.label} o‘lchamini o‘chirish`}
              onClick={() => onChange(sizes.filter((x) => x !== s))}
              className="flex size-8 items-center justify-center text-muted hover:text-ink"
            >
              <XIcon size={14} strokeWidth={2.2} />
            </button>
          </span>
        ))}
        {adding ? (
          <span className="flex h-10 items-center gap-1.5">
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
                if (e.key === "Escape") setAdding(false);
              }}
              placeholder="M yoki 42"
              className="h-10 w-28 rounded-[10px] border border-field px-3 text-sm outline-none focus:border-ink"
            />
            <button type="button" onClick={add} className="h-10 rounded-[10px] bg-ink px-3 text-sm font-semibold text-white">
              Qo‘shish
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex h-10 items-center gap-1.5 rounded-[10px] border border-dashed border-[#A6A6A0] px-3.5 text-sm font-semibold text-soft"
          >
            <PlusIcon size={15} strokeWidth={2.2} />
            O‘lcham qo‘shish
          </button>
        )}
        {sizes.length === 0 && !adding && (
          <button
            type="button"
            onClick={() => onChange(["S", "M", "L", "XL"].map((label) => ({ label, stock: "in" as const })))}
            className="h-10 rounded-[10px] px-3 text-sm font-semibold text-muted hover:bg-panel"
          >
            S, M, L, XL qo‘shish
          </button>
        )}
      </div>
      {sizes.length === 0 && <span className="text-[13px] text-muted">O‘lcham bo‘lmasa, mahsulot «Bitta o‘lcham» bo‘lib sotiladi.</span>}
    </div>
  );
}
