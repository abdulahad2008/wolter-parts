import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { adminCategories, adminProduct, productClicks, sitePosition } from "@/lib/admin-data";
import { siteHost } from "@/lib/env";
import { getSettings } from "@/lib/shop";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = { title: "Tahrirlash" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; copied?: string }> };

export default async function EditProductPage({ params, searchParams }: Props) {
  await requireAdminPage();
  const { id } = await params;
  const sp = await searchParams;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) notFound();
  const p = await adminProduct(productId);
  if (!p) notFound();
  const [categories, settings, position, clicks] = await Promise.all([
    adminCategories(),
    getSettings(),
    p.archived ? Promise.resolve(null) : sitePosition(p.id),
    productClicks(p.id),
  ]);
  return (
    <ProductForm
      initial={{
        id: p.id,
        updatedAt: p.updatedAt.toISOString(),
        name: p.name,
        nameRu: p.nameRu,
        description: p.description,
        categoryId: p.categoryId,
        sku: p.sku,
        slug: p.slug,
        price: p.price,
        oldPrice: p.oldPrice,
        stock: p.stock,
        badge: p.badge,
        sizes: p.sizes,
        specs: p.specs,
        images: p.images,
        visible: p.visible,
      }}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      template={settings.template}
      manager={settings.tgManager}
      host={siteHost()}
      sitePosition={position}
      clicks={clicks}
      notice={sp.created ? "Mahsulot qo‘shildi" : sp.copied ? "Nusxa yaratildi — u hozircha saytda yashirin" : undefined}
    />
  );
}
