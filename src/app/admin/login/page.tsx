import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Kirish" };

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink px-4 py-10">
      <div className="flex w-full max-w-[380px] flex-col gap-6">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-lime.png" alt="Wolter" className="h-5 w-auto" />
          <span className="rounded bg-lime px-[7px] py-[3px] text-xs font-bold tracking-[0.06em] text-ink">ADMIN</span>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
