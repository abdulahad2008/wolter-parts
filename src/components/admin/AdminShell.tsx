"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/app/admin/actions";
import { BarsIcon, BoxIcon, ExternalIcon, GearIcon, GridIcon, LogoutIcon, MenuIcon, XIcon } from "../icons";

const NAV = [
  { href: "/admin", label: "Mahsulotlar", icon: BoxIcon, match: (p: string) => p === "/admin" || p.startsWith("/admin/products") },
  { href: "/admin/categories", label: "Kategoriyalar", icon: GridIcon, match: (p: string) => p.startsWith("/admin/categories") },
  { href: "/admin/clicks", label: "Bosishlar", icon: BarsIcon, match: (p: string) => p.startsWith("/admin/clicks") },
  { href: "/admin/settings", label: "Sozlamalar", icon: GearIcon, match: (p: string) => p.startsWith("/admin/settings") },
];

export function AdminShell({
  admin,
  productCount,
  children,
}: {
  admin: { name: string; email: string };
  productCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const initial = (admin.name || admin.email).trim().charAt(0).toUpperCase();

  const nav = (
    <nav aria-label="Admin menyusi" className="flex flex-col gap-1 text-[15px]">
      {NAV.map(({ href, label, icon: Icon, match }) => {
        const on = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`flex h-11 items-center gap-3 rounded-[10px] px-3 no-underline ${
              on ? "bg-lime font-bold text-ink" : "text-[#D3D3CD] hover:bg-[#1c1b1b]"
            }`}
          >
            <Icon size={19} strokeWidth={1.9} />
            {label}
            {href === "/admin" && <span className="ml-auto text-[13px] font-bold">{productCount}</span>}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <>
      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        className="mt-auto flex h-11 items-center gap-2.5 rounded-[10px] border border-night px-3 text-sm text-[#E3E3DD] no-underline hover:bg-[#1c1b1b]"
      >
        <ExternalIcon size={17} />
        Saytni ochish
      </a>
      <div className="flex items-center gap-2.5 border-t border-night px-2 pt-4">
        <span className="flex size-9 flex-none items-center justify-center rounded-full bg-night font-bold text-lime">{initial}</span>
        <div className="flex min-w-0 flex-1 flex-col text-sm">
          <span className="truncate font-semibold text-white">{admin.name}</span>
          <span className="truncate text-[13px] text-[#9C9C96]">{admin.email}</span>
        </div>
        <form action={logout}>
          <button type="submit" aria-label="Chiqish" title="Chiqish" className="flex size-10 items-center justify-center rounded-lg text-[#9C9C96] hover:bg-[#1c1b1b] hover:text-white">
            <LogoutIcon size={18} />
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="min-h-dvh bg-panel md:flex">
      {/* Computer sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[232px] flex-none flex-col gap-7 bg-ink px-4 py-6 text-[#E3E3DD] md:flex">
        <Brand />
        {nav}
        {footer}
      </aside>

      {/* Phone top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-ink pr-3 pl-1 md:hidden">
        <div className="flex items-center gap-1.5">
          <button type="button" aria-label="Menyu" aria-expanded={open} onClick={() => setOpen(true)} className="flex size-11 items-center justify-center text-white">
            <MenuIcon size={22} />
          </button>
          <Brand small />
        </div>
        <span className="flex size-8 items-center justify-center rounded-full bg-night text-sm font-bold text-lime">{initial}</span>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menyu">
          <button type="button" aria-label="Yopish" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col gap-7 bg-ink px-4 py-5 text-[#E3E3DD]">
            <div className="flex items-center justify-between">
              <Brand />
              <button type="button" aria-label="Yopish" onClick={() => setOpen(false)} className="flex size-10 items-center justify-center text-white">
                <XIcon size={20} />
              </button>
            </div>
            {nav}
            {footer}
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

function Brand({ small }: { small?: boolean }) {
  return (
    <Link href="/admin" className="flex items-center gap-2.5 px-2 no-underline">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-lime.png" alt="Wolter" className={small ? "h-3.5 w-auto" : "h-[18px] w-auto"} />
      <span className={`rounded bg-lime font-bold tracking-[0.06em] text-ink ${small ? "px-1.5 py-0.5 text-[10px]" : "px-[7px] py-[3px] text-xs"}`}>
        ADMIN
      </span>
    </Link>
  );
}
