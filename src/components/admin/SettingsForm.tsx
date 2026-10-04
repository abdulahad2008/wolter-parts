"use client";

import { useEffect, useState, useTransition } from "react";
import { addAdmin, changePassword, removeAdmin, saveSettings, type SettingsInputType } from "@/app/admin/actions";
import { fillTemplate, TEMPLATE_TOKENS } from "@/lib/telegram";
import { MapArt } from "../shop/Location";
import { cardCls, inputCls, labelCls, primaryBtn, secondaryBtn, Segmented, Status } from "./ui";

type AdminInfo = { id: number; email: string; name: string; lastLoginAt: string | null };

export function SettingsForm({
  initial,
  version,
  host,
  admins,
  meId,
}: {
  initial: SettingsInputType;
  version: string;
  host: string;
  admins: AdminInfo[];
  meId: number;
}) {
  const [s, setS] = useState(initial);
  const [flash, setFlash] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const [errField, setErrField] = useState("");
  const [saving, start] = useTransition();
  // Take the server copy only when the saved settings changed (not when e.g. an admin is added).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setS(initial), [version]);

  const set = <K extends keyof SettingsInputType>(k: K, v: SettingsInputType[K]) => {
    setS((prev) => ({ ...prev, [k]: v }));
    if (errField === k) setErrField("");
  };
  const err = (k: string) => (errField === k ? " border-[#A12C1F] ring-2 ring-[#FDECEA]" : "");

  function save() {
    start(async () => {
      const res = await saveSettings(s).catch(() => ({ ok: false as const, error: "Internet aloqasini tekshiring va qayta urinib ko‘ring.", field: "" }));
      if (res.ok) setFlash({ text: res.message ?? "Saqlandi", tone: "ok" });
      else {
        setErrField(res.field ?? "");
        setFlash({ text: res.error, tone: "error" });
        document.getElementById(`s-${res.field}`)?.focus();
      }
    });
  }

  const preview = fillTemplate(s.template, { name: "Wolter City shlemi", sku: "WP-012", slug: "wolter-city-shlemi", price: 289000 }, "M", host);
  const isBot = s.tgMode === "bot";

  return (
    <div className="flex max-w-[980px] flex-col gap-4 px-4 pt-4 pb-28 md:gap-5 md:px-[clamp(16px,3vw,40px)] md:pt-7 md:pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold tracking-[-0.03em] md:text-[28px]">Sozlamalar</h1>
          <span className="text-sm text-[#5E5E58] md:text-[15px]">«Sotib olish» tugmasi va do‘kon manzili</span>
        </div>
        <span className="hidden md:block">
          <button type="button" onClick={save} disabled={saving} className={`${primaryBtn} px-[22px]`}>
            {saving ? "Saqlanmoqda…" : "Saqlash"}
          </button>
        </span>
      </div>
      {flash && (
        <div>
          <Status text={flash.text} tone={flash.tone} onDone={() => setFlash(null)} />
        </div>
      )}

      <section className={cardCls}>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold md:text-lg">«Sotib olish» tugmasi</h2>
          <span className="text-[13px] text-muted md:text-sm">Mijoz tugmani bosganda Telegram qayerda ochilishini tanlang.</span>
        </div>
        <Segmented
          label="Qabul qiluvchi"
          value={s.tgMode}
          onChange={(v) => set("tgMode", v)}
          options={[
            { value: "manager", label: "Menejer akkaunti" },
            { value: "bot", label: "Telegram bot" },
          ]}
        />
        <div className="flex flex-wrap gap-5">
          <div className="flex min-w-0 flex-[1.3_1_340px] flex-col gap-4">
            <label className={labelCls}>
              Menejer Telegram username
              <input id="s-tgManager" className={inputCls + err("tgManager")} value={s.tgManager} onChange={(e) => set("tgManager", e.target.value)} placeholder="@wolteruz" />
            </label>
            {isBot && (
              <label className={labelCls}>
                Bot username
                <input id="s-tgBot" className={inputCls + err("tgBot")} value={s.tgBot} onChange={(e) => set("tgBot", e.target.value)} placeholder="masalan: @wolterparts_bot" />
              </label>
            )}
            <label className={labelCls}>
              Xabar shabloni
              <textarea
                id="s-template"
                rows={4}
                className={`${inputCls} h-auto resize-y py-3 text-sm leading-normal${err("template")}`}
                value={s.template}
                onChange={(e) => set("template", e.target.value)}
              />
            </label>
            <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
              Qo‘yish mumkin:
              {TEMPLATE_TOKENS.map((t) => (
                <button
                  key={t}
                  type="button"
                  title="Shablon oxiriga qo‘shish"
                  onClick={() => set("template", `${s.template} ${t}`.trim())}
                  className="rounded-md bg-tile px-[7px] py-[3px] font-mono text-xs text-ink hover:bg-[#e8e8e2]"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-2">
            <span className="text-[13px] font-semibold text-soft">Mijoz ko‘radigan xabar</span>
            <div className="rounded-[14px_14px_14px_4px] bg-[#F1F1EC] px-3.5 py-3 text-sm leading-normal break-words">{preview}</div>
            <span className="text-[13px] leading-[1.45] text-muted">
              {isBot
                ? "Bot «Start» bilan ochiladi va mahsulot kodini oladi (p_SKU_O‘LCHAM). Bot tayyor bo‘lgach yoqing. Menejer username saytdagi «Telegram» tugmalarida qoladi."
                : "Menejer chatida xabar tayyor holda ochiladi — mijoz faqat «Yuborish»ni bosadi."}
            </span>
          </div>
        </div>
      </section>

      <section className={cardCls}>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold md:text-lg">Do‘kon manzili</h2>
          <span className="text-[13px] text-muted md:text-sm">Saytning «Manzil» bo‘limida va bosh sahifa pastida ko‘rinadi.</span>
        </div>
        <div className="flex flex-wrap gap-5">
          <div className="grid min-w-0 flex-[1.3_1_340px] grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-4">
            <label className={labelCls}>
              Manzil
              <input className={inputCls} value={s.address} onChange={(e) => set("address", e.target.value)} />
            </label>
            <label className={labelCls}>
              Mo‘ljal
              <input className={inputCls} value={s.landmark} onChange={(e) => set("landmark", e.target.value)} />
            </label>
            <label className={labelCls}>
              Ish vaqti
              <input className={inputCls} value={s.hours} onChange={(e) => set("hours", e.target.value)} />
            </label>
            <label className={labelCls}>
              Telefon
              <input type="tel" className={inputCls} value={s.phone} onChange={(e) => set("phone", e.target.value)} />
            </label>
            <label className={`${labelCls} col-span-full`}>
              Yandex Xarita havolasi
              <input id="s-mapUrl" type="url" className={inputCls + err("mapUrl")} value={s.mapUrl} onChange={(e) => set("mapUrl", e.target.value)} />
            </label>
          </div>
          <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-2">
            <span className="text-[13px] font-semibold text-soft">Saytda shunday ko‘rinadi</span>
            <div className="overflow-hidden rounded-2xl border border-line">
              <div className="h-[120px]">
                <MapArt variant="small" />
              </div>
              <div className="flex flex-col gap-[3px] px-3.5 py-3 text-[13px]">
                <span className="text-sm font-semibold">{s.address || "—"}</span>
                {s.landmark && <span className="text-muted">Mo‘ljal: {s.landmark}</span>}
                <span className="text-muted">{[s.hours, s.phone].filter(Boolean).join(" · ")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AdminsCard admins={admins} meId={meId} />

      <div className="pb-safe fixed right-0 bottom-0 left-0 z-30 border-t border-panel-line bg-white px-4 pt-3 md:hidden">
        <button type="button" onClick={save} disabled={saving} className={`${primaryBtn} h-[52px] w-full rounded-xl text-base`}>
          {saving ? "Saqlanmoqda…" : "Saqlash"}
        </button>
      </div>
    </div>
  );
}

function AdminsCard({ admins, meId }: { admins: AdminInfo[]; meId: number }) {
  const [busy, start] = useTransition();
  const [flash, setFlash] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const [form, setForm] = useState({ email: "", name: "", password: "" });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [adding, setAdding] = useState(false);

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>, after?: () => void) =>
    start(async () => {
      const res: { ok: boolean; message?: string; error?: string } = await fn().catch(() => ({
        ok: false,
        error: "Internet aloqasini tekshiring va qayta urinib ko‘ring.",
      }));
      setFlash(res.ok ? { text: res.message ?? "Saqlandi", tone: "ok" } : { text: res.error ?? "Xatolik", tone: "error" });
      if (res.ok) after?.();
    });

  return (
    <section className={cardCls}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold md:text-lg">Adminlar</h2>
          <span className="text-[13px] text-muted md:text-sm">Admin panelga kira oladigan odamlar.</span>
        </div>
        {flash && <Status text={flash.text} tone={flash.tone} onDone={() => setFlash(null)} />}
      </div>
      <div className="flex flex-col">
        {admins.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center gap-3 border-b border-line py-2.5 last:border-0">
            <span className="flex size-9 flex-none items-center justify-center rounded-full bg-ink text-sm font-bold text-lime">
              {(a.name || a.email).charAt(0).toUpperCase()}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold">
                {a.name} {a.id === meId && <span className="font-normal text-muted">(siz)</span>}
              </span>
              <span className="truncate text-[13px] text-muted">{a.email}</span>
            </span>
            {a.id !== meId && (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => removeAdmin(a.id))}
                className="h-9 rounded-[10px] px-3 text-sm font-semibold text-[#A12C1F] hover:bg-[#FFF6F5]"
              >
                O‘chirish
              </button>
            )}
          </div>
        ))}
      </div>

      {adding ? (
        <form
          className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] items-end gap-3 rounded-xl bg-panel p-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => addAdmin(form), () => {
              setForm({ email: "", name: "", password: "" });
              setAdding(false);
            });
          }}
        >
          <label className={labelCls}>
            Ismi
            <input className={inputCls} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className={labelCls}>
            Email
            <input type="email" className={inputCls} required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className={labelCls}>
            Parol (kamida 8 belgi)
            <input type="password" autoComplete="new-password" className={inputCls} required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className={primaryBtn}>
              Qo‘shish
            </button>
            <button type="button" onClick={() => setAdding(false)} className={secondaryBtn}>
              Bekor
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="h-10 self-start rounded-[10px] border border-dashed border-[#A6A6A0] px-3.5 text-sm font-semibold text-soft">
          + Admin qo‘shish
        </button>
      )}

      <form
        className="flex flex-col gap-3 border-t border-line pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => changePassword(pw), () => setPw({ current: "", next: "" }));
        }}
      >
        <h3 className="text-[15px] font-semibold">Parolni o‘zgartirish</h3>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] items-end gap-3">
          <label className={labelCls}>
            Joriy parol
            <input type="password" autoComplete="current-password" className={inputCls} required value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          </label>
          <label className={labelCls}>
            Yangi parol
            <input type="password" autoComplete="new-password" className={inputCls} required minLength={8} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          </label>
          <button type="submit" disabled={busy} className={secondaryBtn}>
            Parolni yangilash
          </button>
        </div>
      </form>
    </section>
  );
}
