"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";
import { inputCls, labelCls } from "./ui";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="flex flex-col gap-4 rounded-[18px] bg-white p-6">
      <h1 className="text-2xl font-extrabold tracking-[-0.03em]">Kirish</h1>
      <label className={labelCls}>
        Email
        <input name="email" type="email" autoComplete="username" required defaultValue={state && !state.ok ? state.email : ""} className={inputCls} />
      </label>
      <label className={labelCls}>
        Parol
        <input name="password" type="password" autoComplete="current-password" required className={inputCls} />
      </label>
      {state && !state.ok && (
        <p role="alert" className="rounded-[10px] bg-[#FDECEA] px-3 py-2 text-sm font-medium text-[#A12C1F]">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-xl border border-lime-edge bg-lime text-base font-bold disabled:opacity-60"
      >
        {pending ? "Tekshirilmoqda…" : "Kirish"}
      </button>
    </form>
  );
}
