import Link from "next/link";
import type { StoreInfo } from "@/lib/shop";
import { PinIcon } from "../icons";

/** Drawn map (no third-party map script): a pin on light streets. The whole tile opens Yandex Maps. */
export function MapArt({ variant = "wide" }: { variant?: "wide" | "tall" | "small" }) {
  if (variant === "tall") {
    return (
      <svg viewBox="0 0 358 260" className="block h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect width="358" height="260" fill="#ECECE7" />
        <path d="M-10 176 L370 118" stroke="#FFFFFF" strokeWidth="16" />
        <path d="M112 -10 L148 270" stroke="#FFFFFF" strokeWidth="12" />
        <path d="M268 -10 L238 270" stroke="#FFFFFF" strokeWidth="9" />
        <path d="M-10 56 L370 32" stroke="#FFFFFF" strokeWidth="7" />
        <path d="M14 270 L60 -10" stroke="#FFFFFF" strokeWidth="5" />
        <path d="M-10 236 L370 216" stroke="#FFFFFF" strokeWidth="5" />
        <rect x="170" y="168" width="56" height="38" rx="6" fill="#DDE4D2" />
        <rect x="292" y="62" width="44" height="42" rx="6" fill="#DDE4D2" />
        <path d="M179 74c-13 0-24 10.5-24 23.5 0 18 24 40.5 24 40.5s24-22.5 24-40.5c0-13-11-23.5-24-23.5z" fill="#0F0E0E" />
        <circle cx="179" cy="97.5" r="8.5" fill="#E5FF00" />
        <ellipse cx="179" cy="141" rx="10" ry="3" fill="#0F0E0E" opacity="0.18" />
      </svg>
    );
  }
  if (variant === "small") {
    return (
      <svg viewBox="0 0 358 160" className="block h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect width="358" height="160" fill="#ECECE7" />
        <path d="M-10 112 L370 76" stroke="#FFFFFF" strokeWidth="14" />
        <path d="M118 -10 L146 170" stroke="#FFFFFF" strokeWidth="10" />
        <path d="M262 -10 L238 170" stroke="#FFFFFF" strokeWidth="8" />
        <path d="M-10 36 L370 20" stroke="#FFFFFF" strokeWidth="6" />
        <rect x="168" y="106" width="52" height="34" rx="6" fill="#DDE4D2" />
        <path d="M179 30c-11 0-20 9-20 20 0 15 20 34 20 34s20-19 20-34c0-11-9-20-20-20z" fill="#0F0E0E" />
        <circle cx="179" cy="50" r="7" fill="#E5FF00" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 720 340" className="absolute inset-0 block h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="720" height="340" fill="#ECECE7" />
      <path d="M-10 236 L730 140" stroke="#FFFFFF" strokeWidth="18" />
      <path d="M220 -10 L290 350" stroke="#FFFFFF" strokeWidth="13" />
      <path d="M520 -10 L480 350" stroke="#FFFFFF" strokeWidth="10" />
      <path d="M-10 70 L730 30" stroke="#FFFFFF" strokeWidth="8" />
      <path d="M40 350 L110 -10" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M-10 310 L730 284" stroke="#FFFFFF" strokeWidth="6" />
      <rect x="330" y="214" width="80" height="50" rx="8" fill="#DDE4D2" />
      <rect x="590" y="80" width="70" height="60" rx="8" fill="#DDE4D2" />
      <path d="M360 92c-15 0-27 12-27 27 0 20 27 46 27 46s27-26 27-46c0-15-12-27-27-27z" fill="#0F0E0E" />
      <circle cx="360" cy="119" r="9.5" fill="#E5FF00" />
    </svg>
  );
}

/** Bottom of the products page: compact on phones, map + details side by side on computers. */
export function LocationSection({ info }: { info: StoreInfo }) {
  return (
    <>
      <section className="mx-4 mt-10 flex flex-col gap-3 md:hidden">
        <h2 className="text-lg font-extrabold tracking-[-0.02em]">Olib ketish manzili</h2>
        <Link href="/manzil" aria-label="Manzilni ko‘rish" className="block h-40 overflow-hidden rounded-2xl bg-tile-2">
          <MapArt variant="small" />
        </Link>
        <div className="flex flex-col gap-1 text-sm">
          <span className="font-semibold">{info.address}</span>
          <span className="text-muted">
            {[info.landmark && `Mo‘ljal: ${info.landmark}`, info.hours].filter(Boolean).join(" · ")}
          </span>
        </div>
        <div className="flex gap-2.5">
          <a href={info.mapUrl} className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink text-sm font-semibold text-white">
            <PinIcon size={16} className="text-lime" />
            Xaritada ochish
          </a>
          {info.phone && (
            <a href={info.phoneHref} className="flex h-12 flex-1 items-center justify-center rounded-xl bg-tile text-sm font-semibold">
              Qo‘ng‘iroq qilish
            </a>
          )}
        </div>
      </section>

      <section
        id="manzil"
        className="mt-14 hidden scroll-mt-6 flex-wrap items-stretch gap-8 border-t border-line pt-10 md:flex"
      >
        <a
          href={info.mapUrl}
          aria-label="Yandex Xaritada ochish"
          className="relative block min-h-80 min-w-0 flex-[1.5_1_480px] overflow-hidden rounded-[20px] bg-tile-2"
        >
          <MapArt />
        </a>
        <div className="flex min-w-0 flex-[1_1_320px] flex-col justify-center gap-[18px]">
          <h2 className="text-[28px] font-extrabold tracking-[-0.03em]">Olib ketish manzili</h2>
          <div className="flex flex-col gap-1.5 text-base">
            <span className="font-semibold">{info.address}</span>
            {info.landmark && <span className="text-muted">Mo‘ljal: {info.landmark}</span>}
            {info.hours && <span className="text-muted">{info.hours}</span>}
            {info.phone && (
              <a href={info.phoneHref} className="pt-1 hover:underline">
                {info.phone}
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <a href={info.mapUrl} className="flex h-12 items-center gap-2 rounded-xl bg-ink px-[18px] text-[15px] font-semibold text-white">
              <PinIcon size={16} className="text-lime" />
              Yandex Xaritada ochish
            </a>
            <a href={info.chatUrl} className="flex h-12 items-center rounded-xl bg-tile px-[18px] text-[15px] font-semibold">
              Telegram’da yozish
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export function Footer() {
  return (
    <footer className="mt-8 border-t border-line md:mt-14">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-4 pt-5 pb-28 text-xs text-muted md:px-[clamp(16px,4vw,48px)] md:pb-5 md:text-[13px]">
        <span>© {new Date().getFullYear()} GETNOW MChJ · Wolter</span>
        <a href="https://wolter.uz" className="py-3 font-semibold text-soft no-underline">
          wolter.uz
        </a>
      </div>
    </footer>
  );
}
