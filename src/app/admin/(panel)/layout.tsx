import { and, count, eq } from "drizzle-orm";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { products } from "@/lib/schema";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  const [{ n }] = await getDb().select({ n: count() }).from(products).where(and(eq(products.archived, false)));
  return (
    <AdminShell admin={{ name: admin.name, email: admin.email }} productCount={Number(n)}>
      {children}
    </AdminShell>
  );
}
