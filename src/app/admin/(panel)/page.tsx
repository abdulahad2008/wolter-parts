import type { Metadata } from "next";
import { ProductsBoard } from "@/components/admin/ProductsBoard";
import { adminProducts } from "@/lib/admin-data";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = { title: "Mahsulotlar" };

export default async function AdminProductsPage() {
  await requireAdminPage();
  const { active, archived } = await adminProducts();
  return <ProductsBoard active={active} archived={archived} />;
}
