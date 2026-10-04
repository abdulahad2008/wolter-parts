"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/** One line of the customer's Ro‘yxat, kept in this browser only. */
export type ListItem = { id: number; size: string; qty: number };

type ListApi = {
  items: ListItem[];
  ready: boolean;
  count: number;
  has: (id: number) => boolean;
  add: (id: number, size?: string, qty?: number) => void;
  removeProduct: (id: number) => void;
  remove: (id: number, size: string) => void;
  setQty: (id: number, size: string, qty: number) => void;
  setSize: (id: number, oldSize: string, newSize: string) => void;
  clear: () => void;
};

const KEY = "wolter-parts:list:v1";
export const MAX_QTY = 9;
const Ctx = createContext<ListApi | null>(null);

function read(): ListItem[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((x) => x && Number.isInteger(x.id) && typeof x.size === "string")
      .map((x) => ({ id: x.id, size: x.size, qty: Math.min(MAX_QTY, Math.max(1, Number(x.qty) || 1)) }))
      .slice(0, 50);
  } catch {
    return [];
  }
}

export function ListProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ListItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(read());
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((fn: (prev: ListItem[]) => ListItem[]) => {
    setItems((prev) => {
      const next = fn(prev);
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* private mode: the list just won't survive a reload */
      }
      return next;
    });
  }, []);

  const api = useMemo<ListApi>(
    () => ({
      items,
      ready,
      count: items.length,
      has: (id) => items.some((x) => x.id === id),
      add: (id, size = "", qty = 1) =>
        update((prev) => {
          const found = prev.find((x) => x.id === id && x.size === size);
          if (found) return prev.map((x) => (x === found ? { ...x, qty: Math.min(MAX_QTY, x.qty + qty) } : x));
          return [...prev, { id, size, qty: Math.min(MAX_QTY, qty) }];
        }),
      removeProduct: (id) => update((prev) => prev.filter((x) => x.id !== id)),
      remove: (id, size) => update((prev) => prev.filter((x) => !(x.id === id && x.size === size))),
      setQty: (id, size, qty) =>
        update((prev) =>
          prev.map((x) => (x.id === id && x.size === size ? { ...x, qty: Math.min(MAX_QTY, Math.max(1, qty)) } : x)),
        ),
      setSize: (id, oldSize, newSize) =>
        update((prev) => {
          const target = prev.find((x) => x.id === id && x.size === oldSize);
          if (!target) return prev;
          const twin = prev.find((x) => x.id === id && x.size === newSize && x !== target);
          if (twin) {
            // Same product and size already listed: merge the two lines.
            return prev
              .filter((x) => x !== target)
              .map((x) => (x === twin ? { ...x, qty: Math.min(MAX_QTY, x.qty + target.qty) } : x));
          }
          return prev.map((x) => (x === target ? { ...x, size: newSize } : x));
        }),
      clear: () => update(() => []),
    }),
    [items, ready, update],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useList(): ListApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useList must be used inside <ListProvider>");
  return ctx;
}

/** Records a tap on «Sotib olish» without delaying the jump to Telegram. */
export function logBuy(kind: "single" | "list", items: ListItem[]) {
  try {
    const body = JSON.stringify({ kind, items });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/click", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/click", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
    }
  } catch {
    /* counting is best-effort */
  }
}
