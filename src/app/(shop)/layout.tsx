import { Footer } from "@/components/shop/Location";
import { Header } from "@/components/shop/Header";
import { ListProvider } from "@/components/shop/ListProvider";
import { getSettings, storeInfo } from "@/lib/shop";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const info = storeInfo(await getSettings());
  return (
    <ListProvider>
      <Header chatUrl={info.chatUrl} />
      <main>{children}</main>
      <Footer />
    </ListProvider>
  );
}
