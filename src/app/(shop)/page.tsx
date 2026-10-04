import { Suspense } from "react";
import { Catalog } from "@/components/shop/Catalog";
import { LocationSection } from "@/components/shop/Location";
import { getSettings, getShopCategories, getShopProducts, storeInfo } from "@/lib/shop";

export default async function ProductsPage() {
  const [products, categories, settings] = await Promise.all([getShopProducts(), getShopCategories(), getSettings()]);
  return (
    <>
      <h1 className="sr-only">Wolter Parts — mahsulotlar</h1>
      <Suspense>
        <Catalog products={products} categories={categories} />
      </Suspense>
      <div className="md:mx-auto md:max-w-[1280px] md:px-[clamp(16px,4vw,48px)]">
        <LocationSection info={storeInfo(settings)} />
      </div>
    </>
  );
}
