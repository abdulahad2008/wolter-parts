import type { Metadata } from "next";
import { ClockIcon, PhoneIcon, PinIcon, SendIcon } from "@/components/icons";
import { MapArt } from "@/components/shop/Location";
import { getSettings, storeInfo } from "@/lib/shop";

export const metadata: Metadata = { title: "Olib ketish manzili" };

export default async function LocationPage() {
  const info = storeInfo(await getSettings());
  return (
    <div className="mx-auto max-w-[640px] pb-6">
      <div className="flex h-[60px] items-center px-4 md:h-auto md:pt-8 md:pb-5">
        <h1 className="text-[22px] font-extrabold tracking-[-0.03em] md:text-[32px]">Olib ketish manzili</h1>
      </div>
      <a href={info.mapUrl} aria-label="Yandex Xaritada ochish" className="mx-4 block aspect-[358/260] overflow-hidden rounded-[18px] bg-tile-2">
        <MapArt variant="tall" />
      </a>
      <div className="flex flex-col gap-3.5 px-4 pt-3">
        <div className="flex flex-col">
          <div className="flex gap-3 border-b border-line py-3">
            <PinIcon size={20} className="mt-px flex-none" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[15px] font-semibold">{info.address}</span>
              {info.landmark && <span className="text-[13px] text-muted">Mo‘ljal: {info.landmark}</span>}
            </div>
          </div>
          {info.hours && (
            <div className="flex items-center gap-3 border-b border-line py-3">
              <ClockIcon size={20} className="flex-none" />
              <span className="text-[15px]">{info.hours}</span>
            </div>
          )}
          {info.phone && (
            <a href={info.phoneHref} className="flex items-center gap-3 py-3 no-underline">
              <PhoneIcon size={20} className="flex-none" />
              <span className="text-[15px]">{info.phone}</span>
            </a>
          )}
        </div>
        <a href={info.mapUrl} className="flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-ink text-[15px] font-bold text-white">
          <PinIcon size={17} className="text-lime" />
          Yandex Xaritada ochish
        </a>
        <a href={info.chatUrl} className="flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-tile text-[15px] font-semibold">
          <SendIcon size={17} />
          Telegram’da yozish
        </a>
      </div>
    </div>
  );
}
