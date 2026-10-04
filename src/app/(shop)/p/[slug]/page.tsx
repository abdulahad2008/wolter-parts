import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "@/components/icons";
import { ProductPhoto } from "@/components/shop/ProductPhoto";
import { BuyBox, Gallery, ShareButton } from "@/components/shop/ProductParts";
import { env } from "@/lib/env";
import { money, STOCK_DOT, STOCK_LABEL } from "@/lib/format";
import { buyTarget, getProductBySlug, getRelated, getSettings, storeInfo } from "@/lib/shop";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = await getProductBySlug(slug);
  if (!found) return { title: "Topilmadi" };
  const p = found.product;
  const description = `${money(p.price).replace(/ /g, " ")} so‘m. ${p.description}`.trim().slice(0, 200);
  const image = p.images[0] ? `${env.siteUrl}/media/${p.images[0].key}-og.jpg` : `${env.siteUrl}/brand/og.jpg`;
  return {
    title: p.name,
    description,
    alternates: { canonical: `/p/${p.slug}` },
    openGraph: {
      title: p.name,
      description,
      url: `/p/${p.slug}`,
      images: [{ url: image, width: 1200, height: p.images[0] ? 1200 : 630, alt: p.name }],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const found = await getProductBySlug(slug);
  if (!found) notFound();
  const { product: p, category } = found;
  const [settings, related] = await Promise.all([getSettings(), getRelated(p)]);
  const info = storeInfo(settings);
  const backHref = category ? `/?c=${category.slug}` : "/";

  return (
    <div className="pb-28 md:mx-auto md:max-w-[1280px] md:px-[clamp(16px,4vw,48px)] md:pt-5 md:pb-0">
      {/* Phone: back + share */}
      <div className="flex h-11 items-center justify-between px-2 md:hidden">
        <Link href={backHref} className="flex h-11 items-center gap-1 px-2 text-sm font-medium text-soft no-underline">
          <ChevronLeft size={18} strokeWidth={2.2} />
          {category?.name ?? "Mahsulotlar"}
        </Link>
        <ShareButton name={p.name} />
      </div>

      {/* Computer: breadcrumb */}
      <nav aria-label="Joylashuv" className="mb-6 hidden flex-wrap gap-2 text-sm text-muted md:flex">
        <Link href="/" className="hover:text-ink">Mahsulotlar</Link>
        <span>/</span>
        {category && (
          <>
            <Link href={backHref} className="hover:text-ink">{category.name}</Link>
            <span>/</span>
          </>
        )}
        <span className="text-ink">{p.name}</span>
      </nav>

      <div className="md:flex md:flex-wrap md:items-start md:gap-12">
        <div className="min-w-0 md:flex-[1.15_1_480px]">
          <Gallery p={p} />
        </div>

        <div className="flex min-w-0 flex-col gap-3 px-5 pt-4 md:flex-[1_1_380px] md:gap-[18px] md:px-0 md:pt-2">
          <div className="flex flex-col gap-1 md:gap-2">
            <h1 className="text-[22px] leading-[1.2] font-bold tracking-[-0.02em] md:text-[34px] md:leading-[1.1] md:font-extrabold md:tracking-[-0.035em]">
              {p.name}
            </h1>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 md:justify-start">
              <span className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold tracking-[-0.03em] md:text-[30px]">{money(p.price)} so‘m</span>
                {p.oldPrice && p.oldPrice > p.price ? (
                  <span className="text-sm text-faint line-through md:text-base">{money(p.oldPrice)}</span>
                ) : null}
              </span>
              <span className="flex items-center gap-1.5 text-[13px] text-soft md:text-sm">
                <span className="size-2 rounded-full" style={{ background: STOCK_DOT[p.stock] }} />
                {STOCK_LABEL[p.stock]}
              </span>
            </div>
          </div>

          <BuyBox p={p} target={buyTarget(settings)} chatUrl={info.chatUrl} />

          {p.description && (
            <p className="mt-0.5 text-sm leading-[1.55] whitespace-pre-line text-soft md:mt-0 md:text-[15px] md:leading-[1.6]">
              {p.description}
            </p>
          )}
          <dl className="flex flex-col text-sm md:text-[15px]">
            {[...p.specs.filter((s) => s.k && s.v), { k: "SKU", v: p.sku }].map((s) => (
              <div key={s.k} className="flex justify-between gap-3 border-t border-line py-2.5 md:py-3">
                <dt className="text-muted">{s.k}</dt>
                <dd className="text-right font-medium">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-10 flex flex-col gap-4 px-4 md:px-0 md:gap-[18px]">
          <h2 className="text-lg font-extrabold tracking-[-0.03em] md:text-[22px]">O‘xshash mahsulotlar</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-4 md:gap-5">
            {related.map((r) => (
              <Link key={r.id} href={`/p/${r.slug}`} className="flex flex-col gap-2 no-underline md:gap-2.5">
                <span className="overflow-hidden rounded-2xl md:rounded-[18px]">
                  <ProductPhoto image={r.images[0]} alt={r.name} />
                </span>
                <span className="text-sm font-medium md:text-[15px]">{r.name}</span>
                <span className="text-[15px] font-extrabold tracking-[-0.02em] md:text-[17px]">{money(r.price)} so‘m</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
