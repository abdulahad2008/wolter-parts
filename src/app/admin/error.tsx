"use client";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-extrabold tracking-[-0.03em]">Xatolik yuz berdi</h1>
      <p className="max-w-sm text-sm text-muted">Sahifani qayta yuklang. Takrorlansa, internet aloqasini tekshiring yoki birozdan keyin urinib ko‘ring.</p>
      <div className="flex gap-2.5">
        <button type="button" onClick={reset} className="h-11 rounded-[11px] border border-lime-edge bg-lime px-5 font-bold">
          Qayta urinish
        </button>
        <a href="/admin" className="flex h-11 items-center rounded-[11px] border border-[#D6D6CF] bg-white px-4 text-sm font-semibold">
          Mahsulotlarga
        </a>
      </div>
    </div>
  );
}
