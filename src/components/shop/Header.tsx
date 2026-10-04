"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ListIcon, PinIcon, SearchIcon, SendIcon } from "../icons";
import { useList } from "./ListProvider";

export function Header({ chatUrl }: { chatUrl: string }) {
  const pathname = usePathname();
  const { count, ready } = useList();
  const onList = pathname === "/royxat";
  const onMap = pathname === "/manzil";

  return (
    <header className={`border-line md:border-b ${pathname === "/" ? "" : "border-b"}`}>
      {/* Phone */}
      <div className="flex h-[60px] items-center justify-between pr-2 pl-4 md:hidden">
        <Logo small />
        <nav aria-label="Sayt menyusi" className="flex items-center gap-0.5">
          <Link
            href="/manzil"
            aria-label="Manzil"
            aria-current={onMap ? "page" : undefined}
            className={`flex size-11 items-center justify-center rounded-xl ${onMap ? "bg-lime" : ""}`}
          >
            <PinIcon size={21} />
          </Link>
          <Link
            href="/royxat"
            aria-label={ready && count ? `Ro‘yxat, ${count} ta` : "Ro‘yxat"}
            aria-current={onList ? "page" : undefined}
            className={`relative flex size-11 items-center justify-center rounded-xl ${onList ? "bg-lime" : ""}`}
          >
            <ListIcon size={21} />
            {ready && count > 0 && !onList && (
              <span className="absolute top-1 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-[1.5px] border-ink bg-lime px-1 text-[11px] font-bold">
                {count}
              </span>
            )}
          </Link>
          <a
            href={chatUrl}
            aria-label="Telegram orqali yozish"
            className="ml-1 flex size-11 items-center justify-center rounded-xl bg-ink text-lime"
          >
            <SendIcon size={18} />
          </a>
        </nav>
      </div>

      {/* Computer */}
      <div className="mx-auto hidden max-w-[1280px] flex-wrap items-center gap-6 px-[clamp(16px,4vw,48px)] py-[18px] md:flex">
        <Logo />
        <Suspense fallback={<div className="h-12 max-w-[560px] flex-[1_1_280px] rounded-[14px] bg-tile" />}>
          <HeaderSearch />
        </Suspense>
        <nav aria-label="Sayt menyusi" className="ml-auto flex flex-wrap items-center gap-1.5">
          <Link href="/#manzil" className="flex h-11 items-center gap-2 rounded-xl px-3 text-[15px] font-medium hover:bg-tile">
            <PinIcon size={18} />
            Manzil
          </Link>
          <Link
            href="/royxat"
            aria-current={onList ? "page" : undefined}
            className={`flex h-11 items-center gap-2 rounded-xl px-3 text-[15px] ${onList ? "bg-lime font-semibold" : "font-medium hover:bg-tile"}`}
          >
            <ListIcon size={18} />
            Ro‘yxat
            {ready && count > 0 && (
              onList ? (
                <span>· {count}</span>
              ) : (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-lime px-[5px] text-xs font-bold">
                  {count}
                </span>
              )
            )}
          </Link>
          <a
            href={chatUrl}
            className="flex h-11 items-center gap-2 rounded-xl bg-ink px-4 text-[15px] font-semibold text-white hover:bg-[#2a2929]"
          >
            <SendIcon size={17} className="text-lime" />
            Telegram
          </a>
        </nav>
      </div>
    </header>
  );
}

function Logo({ small }: { small?: boolean }) {
  return (
    <Link href="/" aria-label="Wolter Parts bosh sahifa" className="flex items-center gap-2 no-underline md:gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-black.png" alt="Wolter" width={882} height={128} className={small ? "h-4 w-auto" : "h-[22px] w-auto"} />
      <span className={`font-semibold text-muted ${small ? "text-[13px]" : "text-[15px]"}`}>Parts</span>
    </Link>
  );
}

/** Desktop search box. On the products page it filters as you type; elsewhere Enter opens the results. */
function HeaderSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const urlQ = pathname === "/" ? params.get("q") ?? "" : "";
  const [q, setQ] = useState(urlQ);

  useEffect(() => setQ(urlQ), [urlQ]);

  return (
    <form
      role="search"
      className="flex h-12 max-w-[560px] flex-[1_1_280px] items-center gap-2.5 rounded-[14px] bg-tile px-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (pathname !== "/") router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
      }}
    >
      <SearchIcon size={19} strokeWidth={1.9} className="text-muted" />
      <input
        type="search"
        aria-label="Mahsulot qidirish"
        placeholder="Mahsulot qidirish"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          if (pathname === "/") setUrlParam("q", e.target.value);
        }}
        className="min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none placeholder:text-muted"
      />
    </form>
  );
}

/** Changes ?q= / ?c= / ?sort= without reloading the page (Next keeps useSearchParams in sync). */
export function setUrlParam(key: string, value: string) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(key, value);
  else url.searchParams.delete(key);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}
