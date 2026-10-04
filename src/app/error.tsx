"use client";

export default function ShopError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-extrabold tracking-[-0.03em]">Nimadir xato ketdi</h1>
      <p className="max-w-sm text-sm text-muted">Sahifani qayta yuklab ko‘ring. Buyurtma uchun Telegram’da @wolteruz ga yozishingiz mumkin.</p>
      <div className="flex gap-2.5">
        <button type="button" onClick={reset} className="h-12 rounded-xl bg-ink px-5 text-sm font-semibold text-white">
          Qayta urinish
        </button>
        <a href="https://t.me/wolteruz" className="flex h-12 items-center rounded-xl bg-tile px-5 text-sm font-semibold">
          Telegram
        </a>
      </div>
    </div>
  );
}
