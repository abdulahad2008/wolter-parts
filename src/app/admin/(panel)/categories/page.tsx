import type { Metadata } from "next";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { adminCategories } from "@/lib/admin-data";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = { title: "Kategoriyalar" };

export default async function CategoriesPage() {
  await requireAdminPage();
  const cats = await adminCategories();
  return <CategoriesManager categories={cats.map((c) => ({ id: c.id, name: c.name, visible: c.visible, productCount: c.productCount }))} />;
}
