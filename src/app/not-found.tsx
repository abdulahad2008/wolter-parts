import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-black.png" alt="Wolter" className="h-5 w-auto" />
      <h1 className="text-2xl font-extrabold tracking-[-0.03em]">Sahifa topilmadi</h1>
      <p className="text-sm text-muted">Mahsulot sotuvdan olingan yoki havola noto‘g‘ri bo‘lishi mumkin.</p>
      <Link href="/" className="flex h-12 items-center rounded-xl bg-ink px-5 text-sm font-semibold text-white">
        Mahsulotlarga qaytish
      </Link>
    </div>
  );
}
