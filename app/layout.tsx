import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Providers } from "@/components/site/providers";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const description =
  "Upload your syllabi. OwlCast forecasts every week of your semester and tells you when to start, so the big weeks never catch you off guard.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "OwlCast · The forecast for your semester",
    template: "%s · OwlCast",
  },
  description,
  applicationName: "OwlCast",
  openGraph: {
    title: "OwlCast · The forecast for your semester",
    description,
    siteName: "OwlCast",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "OwlCast · The forecast for your semester",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#9D2235",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only z-[60] rounded-xl bg-cherry px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <Providers>
          <SiteHeader />
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
