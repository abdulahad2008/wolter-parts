import type { Metadata } from "next";
import { clickStats } from "@/lib/admin-data";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = { title: "Bosishlar" };

export default async function ClicksPage() {
  await requireAdminPage();
  const s = await clickStats();
  const max = Math.max(1, ...s.perDay.map((d) => d.n));
  return (
    <div className="flex max-w-[1080px] flex-col gap-4 px-4 pt-4 pb-12 md:gap-5 md:px-[clamp(16px,3vw,40px)] md:pt-7">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-[-0.03em] md:text-[28px]">Bosishlar</h1>
        <span className="text-sm text-[#5E5E58] md:text-[15px]">
          «Sotib olish» tugmasi necha marta bosilgani. Bu buyurtmalar soni emas — Telegram’da yozganlar bundan kamroq bo‘ladi.
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <div className="flex flex-col gap-1 rounded-2xl bg-ink px-5 py-4 text-white">
          <span className="text-sm text-[#BDBDB7]">7 kun</span>
          <span className="text-[28px] font-extrabold text-lime">{s.total7}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-panel-line bg-white px-5 py-4">
          <span className="text-sm text-[#5E5E58]">30 kun</span>
          <span className="text-[28px] font-extrabold">{s.total30}</span>
        </div>
        <div className="col-span-2 flex flex-col gap-2 rounded-2xl border border-panel-line bg-white px-5 py-4 md:col-span-1">
          <span className="text-sm text-[#5E5E58]">Oxirgi 14 kun</span>
          <div className="flex h-12 items-end gap-1" aria-hidden>
            {s.perDay.map((d) => (
              <span
                key={d.day}
                title={`${d.day}: ${d.n}`}
                className={`flex-1 rounded-sm ${d.n ? "bg-ink" : "bg-[#ECECE6]"}`}
                style={{ height: d.n ? `${Math.max(10, (d.n / max) * 100)}%` : "4px" }}
              />
            ))}
          </div>
        </div>
      </div>

      <section className="overflow-x-auto rounded-2xl border border-panel-line bg-white md:rounded-[18px]">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-bold tracking-[0.06em] text-muted uppercase">
              <th className="px-5 py-3">Mahsulot</th>
              <th className="px-3 py-3 text-right">7 kun</th>
              <th className="px-3 py-3 text-right">30 kun</th>
              <th className="px-5 py-3 text-right">Jami</th>
            </tr>
          </thead>
          <tbody>
            {s.table.map((r) => (
              <tr key={r.id} className="border-b border-[#F0F0EA] last:border-0">
                <td className="px-5 py-3">
                  <span className="font-semibold">{r.name}</span> <span className="text-xs text-[#77776F]">{r.sku}</span>
                </td>
                <td className="px-3 py-3 text-right font-semibold">{r.d7}</td>
                <td className="px-3 py-3 text-right">{r.d30}</td>
                <td className="px-5 py-3 text-right text-muted">{r.total}</td>
              </tr>
            ))}
            {s.table.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted">
                  Hali bosish yo‘q. Saytda «Sotib olish» bosilganda shu yerda ko‘rinadi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {s.lists.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Oxirgi Ro‘yxatlar</h2>
          <div className="flex flex-col rounded-2xl border border-panel-line bg-white md:rounded-[18px]">
            {s.lists.map((l) => (
              <div key={l.groupId} className="flex flex-col gap-0.5 border-b border-[#F0F0EA] px-5 py-3 text-sm last:border-0">
                <span className="text-xs text-muted">
                  {new Date(l.at).toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent", dateStyle: "short", timeStyle: "short" })} · {l.items} xil, {l.qty} dona
                </span>
                <span>{l.skus}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
