import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { adminList } from "@/lib/admin-data";
import { requireAdminPage } from "@/lib/auth";
import { siteHost } from "@/lib/env";
import { getSettings } from "@/lib/shop";

export const metadata: Metadata = { title: "Sozlamalar" };

export default async function SettingsPage() {
  const me = await requireAdminPage();
  const [s, admins] = await Promise.all([getSettings(), adminList()]);
  return (
    <SettingsForm
      initial={{
        tgMode: s.tgMode,
        tgManager: s.tgManager ? `@${s.tgManager}` : "",
        tgBot: s.tgBot ? `@${s.tgBot}` : "",
        template: s.template,
        address: s.address,
        landmark: s.landmark,
        hours: s.hours,
        phone: s.phone,
        mapUrl: s.mapUrl,
      }}
      version={s.updatedAt.toISOString()}
      host={siteHost()}
      admins={admins.map((a) => ({ ...a, lastLoginAt: a.lastLoginAt?.toISOString() ?? null }))}
      meId={me.id}
    />
  );
}
