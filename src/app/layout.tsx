import "@fontsource-variable/onest";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { env } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(env.siteUrl),
    title: {
      default: "Wolter Parts — e-velosiped jihozlari va ehtiyot qismlari",
      template: "%s · Wolter Parts",
    },
    description:
      "Shlemlar, qo‘lqoplar, kuryer sumkalari va e-velosiped ehtiyot qismlari. Telegram orqali buyurtma, Toshkentda olib ketish.",
    openGraph: {
      siteName: "Wolter Parts",
      locale: "uz_UZ",
      type: "website",
      images: [{ url: "/brand/og.jpg", width: 1200, height: 630, alt: "Wolter" }],
    },
    robots: env.allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#0F0E0E",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
