"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { archiveProduct, deleteProduct, duplicateProduct, restoreProduct, saveOrder, setVisible } from "@/app/admin/actions";
import type { AdminRow } from "@/lib/admin-data";
import { money, STOCK_CHIP, STOCK_DOT, STOCK_LABEL } from "@/lib/format";
import { ArchiveIcon, CopyIcon, EditIcon, GripIcon, ImageIcon, PlusIcon, SearchIcon } from "../icons";
import { primaryBtn, Status, Toggle } from "./ui";

const NET = { ok: false as const, error: "Internet aloqasini tekshiring va qayta urinib ko‘ring." };

const COLS = "md:grid md:grid-cols-[36px_32px_minmax(220px,2.6fr)_minmax(110px,1.3fr)_minmax(90px,1fr)_minmax(110px,1.2fr)_64px_minmax(110px,1.1fr)_150px] md:gap-3";

export function ProductsBoard({ active, archived }: { active: AdminRow[]; archived: AdminRow[] }) {
  const [order, setOrder] = useState(() => active.map((p) => p.id));
  const [visible, setVis] = useState(() => new Map(active.map((p) => [p.id, p.visible])));
  const [q, setQ] = useState("");
  const [flash, setFlash] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const [, startTransition] = useTransition();

  // New data from the server (after save, add, archive…) replaces local state.
  const serverKey = active.map((p) => `${p.id}:${p.visible ? 1 : 0}`).join(",");
  useEffect(() => {
    setOrder(active.map((p) => p.id));
    setVis(new Map(active.map((p) => [p.id, p.visible])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  const byId = useMemo(() => new Map(active.map((p) => [p.id, p])), [active]);
  const rows = order.map((id) => byId.get(id)).filter((p): p is AdminRow => !!p);
  const needle = q.trim().toLowerCase();
  const filtered = needle ? rows.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(needle)) : rows;
  const maxClicks = Math.max(1, ...rows.map((p) => p.clicks7));
  const visibleCount = rows.filter((p) => visible.get(p.id)).length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active: a, over } = e;
    if (!over || a.id === over.id) return;
    const before = order;
    const next = arrayMove(order, order.indexOf(Number(a.id)), order.indexOf(Number(over.id)));
    setOrder(next);
    startTransition(async () => {
      const res = await saveOrder(next).catch(() => NET);
      if (res.ok) setFlash({ text: res.message ?? "Saqlandi", tone: "ok" });
      else {
        setOrder(before);
        setFlash({ text: res.error, tone: "error" });
      }
    });
  }

  function toggleVisible(id: number, on: boolean) {
    setVis((m) => new Map(m).set(id, on));
    startTransition(async () => {
      const res = await setVisible(id, on).catch(() => NET);
      if (!res.ok) setVis((m) => new Map(m).set(id, !on));
    });
  }

  const name = (id: string | number) => byId.get(Number(id))?.name ?? "";

  return (
    <div className="flex flex-col gap-3 px-4 pt-4 pb-10 md:gap-5 md:px-[clamp(16px,3vw,40px)] md:pt-7">
      <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4">
        <div className="flex flex-col gap-0.5 md:gap-1">
          <h1 className="text-2xl font-extrabold tracking-[-0.03em] md:text-[28px]">Mahsulotlar</h1>
          <span className="text-[13px] text-[#5E5E58] md:text-[15px]">
            {rows.length} ta<span className="hidden md:inline"> mahsulot</span> · {visibleCount} tasi saytda
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <label className="hidden h-11 w-[260px] items-center gap-2 rounded-[11px] border border-field bg-white px-3 md:flex">
            <SearchIcon size={18} strokeWidth={1.8} className="text-[#5E5E58]" />
            <input
              type="search"
              aria-label="Mahsulot qidirish"
              placeholder="Nomi yoki SKU"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
            />
          </label>
          <Link href="/admin/products/new" className={`${primaryBtn} px-3.5 text-sm md:px-[18px] md:text-[15px]`}>
            <PlusIcon size={17} strokeWidth={2.4} />
            <span className="md:hidden">Yangi</span>
            <span className="hidden md:inline">Yangi mahsulot</span>
          </Link>
        </div>
      </div>

      <label className="flex h-[46px] items-center gap-2 rounded-xl border border-field bg-white px-3 md:hidden">
        <SearchIcon size={18} strokeWidth={1.8} className="text-[#5E5E58]" />
        <input
          type="search"
          aria-label="Mahsulot qidirish"
          placeholder="Nomi yoki SKU"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-0 flex-1 border-0 bg-transparent outline-none"
        />
      </label>

      <div className="hidden grid-cols-[repeat(auto-fit,minmax(min(190px,100%),1fr))] gap-4 md:grid">
        <Stat label="Saytda" value={visibleCount} />
        <Stat label="Kam qoldi" value={rows.filter((p) => p.stock === "low").length} tone="warn" />
        <Stat label="Tugagan" value={rows.filter((p) => p.stock === "out").length} />
        <div className="flex flex-col gap-1 rounded-2xl bg-ink px-5 py-4 text-white">
          <span className="text-sm text-[#BDBDB7]">«Sotib olish» bosishlari · 7 kun</span>
          <span className="text-[28px] font-extrabold tracking-[-0.03em] text-lime">{rows.reduce((s, p) => s + p.clicks7, 0)}</span>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-panel-line bg-white px-3 py-2.5 text-[13px] leading-[1.45] text-soft md:hidden">
        <GripIcon size={16} className="mt-0.5 flex-none text-ink" />
        <span>{needle ? "Qidiruv vaqtida tartibni o‘zgartirib bo‘lmaydi." : "Saytdagi tartib shu ro‘yxat tartibi. Nuqtalarni bosib turing va suring."}</span>
      </div>
      {flash && (
        <div className="md:hidden">
          <Status text={flash.text} tone={flash.tone} onDone={() => setFlash(null)} />
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-panel-line bg-white md:overflow-x-auto md:rounded-[18px]">
        <div className="md:min-w-[1020px]">
          <div className="hidden flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5 md:flex">
            <span className="flex items-center gap-2 text-sm text-soft">
              <GripIcon size={16} className="text-ink" />
              {needle
                ? "Qidiruv vaqtida tartibni o‘zgartirib bo‘lmaydi — qidiruvni tozalang."
                : "Saytda mahsulotlar shu tartibda chiqadi. Qatorni chapdagi nuqtalardan ushlab, yuqoriga yoki pastga suring."}
            </span>
            {flash && <Status text={flash.text} tone={flash.tone} onDone={() => setFlash(null)} />}
          </div>
          <div className={`hidden items-center border-b border-line px-5 py-3 text-xs font-bold tracking-[0.06em] text-muted uppercase ${COLS}`}>
            <span />
            <span>№</span>
            <span>Mahsulot</span>
            <span>Kategoriya</span>
            <span>Narx</span>
            <span>Ombor</span>
            <span>Saytda</span>
            <span>Bosishlar</span>
            <span className="text-right">Amallar</span>
          </div>

          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <p className="text-muted">Hali mahsulot yo‘q.</p>
              <Link href="/admin/products/new" className={primaryBtn}>
                <PlusIcon size={17} strokeWidth={2.4} />
                Birinchi mahsulotni qo‘shish
              </Link>
            </div>
          ) : (
            <DndContext
              id="admin-products-order"
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              onDragEnd={onDragEnd}
              accessibility={{
                screenReaderInstructions: {
                  draggable: "Ko‘chirish uchun bo‘sh joy tugmasini bosing, ↑ ↓ bilan suring, yana bo‘sh joy bilan qo‘ying. Bekor qilish — Esc.",
                },
                announcements: {
                  onDragStart: ({ active: a }) => `${name(a.id)} olindi.`,
                  onDragOver: ({ active: a, over }) => (over ? `${name(a.id)} — ${order.indexOf(Number(over.id)) + 1}-o‘ringa.` : ""),
                  onDragEnd: ({ active: a, over }) => (over ? `${name(a.id)} ${order.indexOf(Number(over.id)) + 1}-o‘ringa qo‘yildi.` : "Bekor qilindi."),
                  onDragCancel: () => "Bekor qilindi.",
                },
              }}
            >
              <SortableContext items={filtered.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                {filtered.map((p) => (
                  <Row
                    key={p.id}
                    p={p}
                    pos={order.indexOf(p.id) + 1}
                    visible={visible.get(p.id) ?? p.visible}
                    onVisible={(on) => toggleVisible(p.id, on)}
                    maxClicks={maxClicks}
                    dragDisabled={!!needle}
                    onFlash={setFlash}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
          {needle && filtered.length === 0 && rows.length > 0 && <p className="px-5 py-8 text-center text-sm text-muted">Hech narsa topilmadi.</p>}
        </div>
      </div>

      {archived.length > 0 && <Archive rows={archived} onFlash={setFlash} />}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "warn" }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-panel-line bg-white px-5 py-4">
      <span className="text-sm text-[#5E5E58]">{label}</span>
      <span className={`text-[28px] font-extrabold tracking-[-0.03em] ${tone === "warn" ? "text-warn" : ""}`}>{value}</span>
    </div>
  );
}

function Thumb({ image, size }: { image: string | null; size: number }) {
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/media/${image}-480.webp`} alt="" width={size} height={size} className="flex-none rounded-[10px] bg-tile object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="flex flex-none items-center justify-center rounded-[10px] bg-[#EFEFEA] text-faint" style={{ width: size, height: size }}>
      <ImageIcon size={20} strokeWidth={1.6} />
    </span>
  );
}

function Row({
  p,
  pos,
  visible,
  onVisible,
  maxClicks,
  dragDisabled,
  onFlash,
}: {
  p: AdminRow;
  pos: number;
  visible: boolean;
  onVisible: (on: boolean) => void;
  maxClicks: number;
  dragDisabled: boolean;
  onFlash: (f: { text: string; tone: "ok" | "error" }) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: p.id,
    disabled: dragDisabled,
  });
  const [confirm, setConfirm] = useState(false);
  const [busy, startBusy] = useTransition();
  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(false), 4000);
    return () => clearTimeout(t);
  }, [confirm]);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex items-center gap-2 border-b border-[#F0F0EA] bg-white py-2 pr-2.5 pl-0.5 text-sm md:items-center md:px-5 ${COLS} ${
        isDragging ? "z-10 bg-[#FBFFD6] shadow-[0_8px_24px_rgba(15,14,14,0.15)]" : ""
      }`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`${pos}-o‘rin: ${p.name}. Sudrab tartibni o‘zgartiring`}
        disabled={dragDisabled}
        className="flex h-12 w-9 flex-none touch-none items-center justify-center rounded-lg text-faint hover:bg-panel disabled:cursor-not-allowed disabled:opacity-30 md:h-11 md:cursor-grab"
      >
        <GripIcon size={16} />
      </button>
      <span className="w-5 flex-none text-[13px] font-bold text-faint md:w-auto md:text-sm md:text-muted">{pos}</span>

      <Link href={`/admin/products/${p.id}`} className="flex min-w-0 flex-1 items-center gap-2.5 no-underline md:gap-3">
        <span className="md:hidden">
          <Thumb image={p.image} size={48} />
        </span>
        <span className="hidden md:block">
          <Thumb image={p.image} size={46} />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-semibold">{p.name}</span>
          <span className="flex items-center gap-1.5 text-xs text-[#5E5E58] md:hidden">
            {money(p.price)} so‘m
            <span className="size-1.5 rounded-full" style={{ background: STOCK_DOT[p.stock] }} />
            {STOCK_LABEL[p.stock]}
          </span>
          <span className="hidden text-xs text-[#77776F] md:block">SKU {p.sku}</span>
        </span>
      </Link>

      <span className="hidden truncate text-soft md:block">{p.categoryName}</span>
      <span className="hidden font-semibold whitespace-nowrap md:block">{money(p.price)}</span>
      <span className="hidden md:block">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold whitespace-nowrap"
          style={{ background: STOCK_CHIP[p.stock] }}
        >
          <span className="size-[7px] rounded-full" style={{ background: STOCK_DOT[p.stock] }} />
          {STOCK_LABEL[p.stock]}
        </span>
      </span>
      <span className="flex-none">
        <Toggle on={visible} onChange={onVisible} label={visible ? "Saytda ko‘rinadi" : "Saytda yashirin"} />
      </span>
      <span className="hidden items-center gap-2.5 md:flex">
        <span className="w-8 text-right font-semibold">{p.clicks7}</span>
        <span className="h-1.5 max-w-[110px] flex-1 overflow-hidden rounded-full bg-[#F0F0EA]">
          <span className="block h-1.5 rounded-full bg-ink" style={{ width: `${Math.round((p.clicks7 / maxClicks) * 100)}%` }} />
        </span>
      </span>
      <span className="hidden justify-end gap-1 md:flex">
        <Link href={`/admin/products/${p.id}`} aria-label="Tahrirlash" title="Tahrirlash" className="flex size-11 items-center justify-center rounded-[10px] hover:bg-panel">
          <EditIcon size={18} strokeWidth={1.9} />
        </Link>
        <button
          type="button"
          aria-label="Nusxa olish"
          title="Nusxa olish"
          disabled={busy}
          onClick={() =>
            startBusy(async () => {
              const res = await duplicateProduct(p.id).catch(() => NET);
              if (!res.ok) onFlash({ text: res.error, tone: "error" });
            })
          }
          className="flex size-11 items-center justify-center rounded-[10px] hover:bg-panel disabled:opacity-40"
        >
          <CopyIcon size={18} strokeWidth={1.9} />
        </button>
        {confirm ? (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              startBusy(async () => {
                const res = await archiveProduct(p.id).catch(() => NET);
                onFlash(res.ok ? { text: res.message ?? "Arxivga olindi", tone: "ok" } : { text: res.error, tone: "error" });
                setConfirm(false);
              })
            }
            className="h-11 rounded-[10px] bg-[#FDECEA] px-2.5 text-[13px] font-semibold text-[#A12C1F]"
          >
            Arxivga?
          </button>
        ) : (
          <button
            type="button"
            aria-label="Arxivlash"
            title="Arxivlash"
            onClick={() => setConfirm(true)}
            className="flex size-11 items-center justify-center rounded-[10px] hover:bg-panel"
          >
            <ArchiveIcon size={18} strokeWidth={1.9} />
          </button>
        )}
      </span>
    </div>
  );
}

function Archive({ rows, onFlash }: { rows: AdminRow[]; onFlash: (f: { text: string; tone: "ok" | "error" }) => void }) {
  const [busy, start] = useTransition();
  const [confirmId, setConfirmId] = useState<number | null>(null);
  return (
    <details className="rounded-2xl border border-panel-line bg-white md:rounded-[18px]">
      <summary className="flex h-14 cursor-pointer items-center px-4 text-[15px] font-semibold md:px-5">
        Arxiv · {rows.length} ta
        <span className="ml-2 text-[13px] font-normal text-muted">saytda ko‘rinmaydi</span>
      </summary>
      <div className="border-t border-line">
        {rows.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 border-b border-[#F0F0EA] px-4 py-2.5 last:border-0 md:px-5">
            <Thumb image={p.image} size={40} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-semibold">{p.name}</span>
              <span className="text-xs text-[#77776F]">SKU {p.sku}</span>
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                start(async () => {
                  const res = await restoreProduct(p.id).catch(() => NET);
                  onFlash(res.ok ? { text: res.message ?? "Qaytarildi", tone: "ok" } : { text: res.error, tone: "error" });
                })
              }
              className="h-10 rounded-[10px] border border-[#D6D6CF] px-3 text-sm font-semibold hover:bg-panel"
            >
              Qaytarish
            </button>
            {confirmId === p.id ? (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  start(async () => {
                    const res = await deleteProduct(p.id).catch(() => NET);
                    onFlash(res.ok ? { text: res.message ?? "O‘chirildi", tone: "ok" } : { text: res.error, tone: "error" });
                    setConfirmId(null);
                  })
                }
                className="h-10 rounded-[10px] bg-[#A12C1F] px-3 text-sm font-semibold text-white"
              >
                Ha, butunlay o‘chirish
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmId(p.id)}
                className="h-10 rounded-[10px] border border-[#F1C9C4] px-3 text-sm font-semibold text-[#A12C1F] hover:bg-[#FFF6F5]"
              >
                O‘chirish
              </button>
            )}
          </div>
        ))}
      </div>
    </details>
  );
}
