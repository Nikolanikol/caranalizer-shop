import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/providers/CartProvider";
import { CurrencyProvider } from "@/providers/CurrencyProvider";
import { HtmlLang } from "@/components/HtmlLang";
import { CookieBanner } from "@/components/CookieBanner";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://caranalizer.com";

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    alternates: {
      languages: {
        ru: `${BASE}/ru`,
        en: `${BASE}/en`,
        ar: `${BASE}/ar`,
        "x-default": `${BASE}/en`,
      },
      canonical: `${BASE}/${lang}`,
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!routing.locales.includes(lang as Locale)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div dir={dir} lang={lang} className="flex flex-col min-h-screen">
      <HtmlLang lang={lang} />
      <NextIntlClientProvider messages={messages}>
        <CartProvider>
          <CurrencyProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <CookieBanner />
          </CurrencyProvider>
        </CartProvider>
      </NextIntlClientProvider>
    </div>
  );
}
