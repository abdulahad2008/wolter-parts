"use client";

import { useState, useTransition } from "react";
import { createCategory, deleteCategory, moveCategory, renameCategory, setCategoryVisible } from "@/app/admin/actions";
import { ArrowDown, ArrowUp, TrashIcon } from "../icons";
import { cardCls, inputCls, primaryBtn, Status, Toggle } from "./ui";

type Cat = { id: number; name: string; visible: boolean; productCount: number };

export function CategoriesManager({ categories }: { categories: Cat[] }) {
  const [busy, start] = useTransition();
  const [flash, setFlash] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const [name, setName] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>, after?: () => void) =>
    start(async () => {
      const res: { ok: boolean; message?: string; error?: string } = await fn().catch(() => ({
        ok: false,
        error: "Internet aloqasini tekshiring va qayta urinib ko‘ring.",
      }));
      if (res.ok && res.message) setFlash({ text: res.message, tone: "ok" });
      if (!res.ok) setFlash({ text: res.error ?? "Xatolik", tone: "error" });
      if (res.ok) after?.();
    });

  return (
    <div className="flex max-w-[860px] flex-col gap-4 px-4 pt-4 pb-12 md:gap-5 md:px-[clamp(16px,3vw,40px)] md:pt-7">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-[-0.03em] md:text-[28px]">Kategoriyalar</h1>
        <span className="text-sm text-[#5E5E58] md:text-[15px]">Saytdagi tugmachalar shu tartibda chiqadi. Bo‘sh kategoriya saytda ko‘rinmaydi.</span>
      </div>
      {flash && (
        <div>
          <Status text={flash.text} tone={flash.tone} onDone={() => setFlash(null)} />
        </div>
      )}

      <section className={`${cardCls} gap-0 p-0 md:gap-0 md:p-0`}>
        {categories.map((c, i) => (
          <CatRow
            key={c.id}
            c={c}
            first={i === 0}
            last={i === categories.length - 1}
            busy={busy}
            onRename={(n) => run(() => renameCategory(c.id, n))}
            onVisible={(v) => run(() => setCategoryVisible(c.id, v))}
            onMove={(d) => run(() => moveCategory(c.id, d))}
            onDelete={() => run(() => deleteCategory(c.id))}
          />
        ))}
        {categories.length === 0 && <p className="p-6 text-sm text-muted">Hali kategoriya yo‘q.</p>}
      </section>

      <form
        className="flex flex-wrap gap-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => createCategory(name), () => setName(""));
        }}
      >
        <input className={`${inputCls} max-w-sm flex-1`} placeholder="Yangi kategoriya nomi" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit" disabled={busy || name.trim().length < 2} className={primaryBtn}>
          Qo‘shish
        </button>
      </form>
    </div>
  );
}

function CatRow({
  c,
  first,
  last,
  busy,
  onRename,
  onVisible,
  onMove,
  onDelete,
}: {
  c: Cat;
  first: boolean;
  last: boolean;
  busy: boolean;
  onRename: (name: string) => void;
  onVisible: (v: boolean) => void;
  onMove: (d: -1 | 1) => void;
  onDelete: () => void;
}) {
  const [value, setValue] = useState(c.name);
  const [confirm, setConfirm] = useState(false);
  const changed = value.trim() !== c.name;
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5 last:border-0 md:gap-3 md:px-5">
      <div className="flex flex-col">
        <button type="button" aria-label="Yuqoriga" disabled={first || busy} onClick={() => onMove(-1)} className="flex h-6 w-9 items-center justify-center rounded text-muted hover:bg-panel disabled:opacity-25">
          <ArrowUp size={15} />
        </button>
        <button type="button" aria-label="Pastga" disabled={last || busy} onClick={() => onMove(1)} className="flex h-6 w-9 items-center justify-center rounded text-muted hover:bg-panel disabled:opacity-25">
          <ArrowDown size={15} />
        </button>
      </div>
      <form
        className="flex min-w-0 flex-[1_1_200px] items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (changed) onRename(value);
        }}
      >
        <input aria-label="Kategoriya nomi" className={`${inputCls} h-11`} value={value} onChange={(e) => setValue(e.target.value)} />
        {changed && (
          <button type="submit" disabled={busy} className="h-11 rounded-[10px] bg-ink px-3 text-sm font-semibold text-white">
            Saqlash
          </button>
        )}
      </form>
      <span className="w-24 text-[13px] text-muted">{c.productCount} ta mahsulot</span>
      <Toggle on={c.visible} onChange={onVisible} label={c.visible ? "Saytda ko‘rinadi" : "Saytda yashirin"} disabled={busy} />
      {confirm ? (
        <button type="button" disabled={busy} onClick={onDelete} className="h-10 rounded-[10px] bg-[#FDECEA] px-3 text-sm font-semibold text-[#A12C1F]">
          O‘chirilsinmi?
        </button>
      ) : (
        <button type="button" aria-label="O‘chirish" onClick={() => setConfirm(true)} className="flex size-10 items-center justify-center rounded-[10px] text-muted hover:bg-panel hover:text-[#A12C1F]">
          <TrashIcon size={17} />
        </button>
      )}
    </div>
  );
}
