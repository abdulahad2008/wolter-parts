import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/ProductForm";
import { adminCategories, nextSku } from "@/lib/admin-data";
import { siteHost } from "@/lib/env";
import { getSettings } from "@/lib/shop";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = { title: "Yangi mahsulot" };

export default async function NewProductPage() {
  await requireAdminPage();
  const [categories, settings, sku] = await Promise.all([adminCategories(), getSettings(), nextSku()]);
  return (
    <ProductForm
      initial={{
        name: "",
        nameRu: "",
        description: "",
        categoryId: categories[0]?.id ?? null,
        sku,
        slug: "",
        price: null,
        oldPrice: null,
        stock: "in",
        badge: "",
        sizes: [],
        specs: [],
        images: [],
        visible: true,
      }}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      template={settings.template}
      manager={settings.tgManager}
      host={siteHost()}
      sitePosition={null}
      clicks={null}
    />
  );
}
