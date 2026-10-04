import type { Metadata } from "next";
import { ListView } from "@/components/shop/ListView";
import { buyTarget, getKnownProductIds, getSettings, getShopProducts, storeInfo } from "@/lib/shop";

export const metadata: Metadata = { title: "Ro‘yxat", robots: { index: false } };

export default async function ListPage() {
  const [products, knownIds, settings] = await Promise.all([getShopProducts(), getKnownProductIds(), getSettings()]);
  return <ListView products={products} knownIds={knownIds} target={buyTarget(settings)} handle={storeInfo(settings).chatHandle} />;
}
