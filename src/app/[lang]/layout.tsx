import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HtmlLang } from "@/components/HtmlLang";
import { CookieBanner } from "@/components/CookieBanner";
import { Toaster } from "sonner";
import { MessengerButtons } from "@/components/MessengerButtons";
import { KmotorsTopBar } from "@/components/KmotorsTopBar";

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
        "x-default": `${BASE}/ru`,
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
  const tn = await getTranslations({ locale: lang as Locale, namespace: "nav" });
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div dir={dir} lang={lang} className="flex flex-col min-h-screen">
      <HtmlLang lang={lang} />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:start-2 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        {tn("skipToContent")}
      </a>
      <NextIntlClientProvider messages={messages}>
        <KmotorsTopBar />
        <Header />
        <main id="main-content" className="flex-1">{children}</main>
        <Footer />
        <CookieBanner />
        <MessengerButtons />
        <Toaster theme="dark" position="top-center" richColors />
      </NextIntlClientProvider>
    </div>
  );
}
