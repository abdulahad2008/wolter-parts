"use client";

import { useEffect, useState } from "react";
import { CheckIcon } from "../icons";

export function Toggle({
  on,
  onChange,
  label,
  size = "md",
  disabled,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  label: string;
  size?: "md" | "lg";
  disabled?: boolean;
}) {
  const lg = size === "lg";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`flex flex-none rounded-full p-[3px] transition-colors disabled:opacity-50 ${lg ? "h-[30px] w-[50px]" : "h-7 w-[46px]"} ${
        on ? "justify-end bg-ink" : "justify-start bg-field"
      }`}
    >
      <span className={`rounded-full ${lg ? "size-6" : "size-[22px]"} ${on ? "bg-lime" : "bg-white"}`} />
    </button>
  );
}

/** Green "saved" pill (or red error) that fades after a few seconds. */
export function Status({ text, tone = "ok", onDone }: { text: string; tone?: "ok" | "error"; onDone?: () => void }) {
  const [shown, setShown] = useState(true);
  useEffect(() => {
    setShown(true);
    if (tone === "error") return;
    const t = setTimeout(() => {
      setShown(false);
      onDone?.();
    }, 3500);
    return () => clearTimeout(t);
  }, [text, tone, onDone]);
  if (!shown || !text) return null;
  return (
    <span
      role={tone === "error" ? "alert" : "status"}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold ${
        tone === "error" ? "bg-[#FDECEA] text-[#A12C1F]" : "bg-[#EAF6EC] text-[#1E6B30]"
      }`}
    >
      {tone === "ok" && <CheckIcon size={14} strokeWidth={3} />}
      {text}
    </span>
  );
}

export const inputCls =
  "h-[46px] w-full min-w-0 rounded-[10px] border border-field bg-white px-3.5 text-[15px] outline-none focus:border-ink";
export const labelCls = "flex flex-col gap-1.5 text-sm font-semibold";
export const cardCls = "flex flex-col gap-4 rounded-2xl border border-panel-line bg-white p-4 md:gap-[18px] md:rounded-[18px] md:p-6";
export const primaryBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[11px] border border-lime-edge bg-lime px-5 text-[15px] font-bold text-ink hover:brightness-95 disabled:opacity-60";
export const secondaryBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[11px] border border-[#D6D6CF] bg-white px-4 text-sm font-semibold hover:bg-panel disabled:opacity-60";
export const dangerBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[11px] border border-[#F1C9C4] bg-white px-4 text-sm font-semibold text-[#A12C1F] hover:bg-[#FFF6F5] disabled:opacity-60";

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap self-start rounded-xl border border-field bg-panel p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={`h-10 rounded-[9px] px-4 text-sm ${o.value === value ? "bg-ink font-semibold text-white" : "font-medium"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
