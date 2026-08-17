import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { MAIN_LOCALE } from "@/lib/seo";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HtmlLang } from "@/components/HtmlLang";
import { CookieBanner } from "@/components/CookieBanner";
import { Toaster } from "sonner";
import { MessengerButtons } from "@/components/MessengerButtons";
import { KmotorsTopBar } from "@/components/KmotorsTopBar";

/**
 * Собираем заранее только русские страницы.
 *
 * Сайт одноязычный: русский — основной и единственный рынок. Многоязычной остаётся
 * одна страница, проверка по VIN, и она рендерится по запросу (`dynamicParams` по
 * умолчанию), а не пачкой на каждый язык. До этого каждая страница собиралась трижды —
 * 42 адреса, из которых 28 никто никогда не открывал, и все они объявляли друг друга
 * языковыми альтернативами.
 *
 * Проверка `routing.locales` ниже остаётся: она отсекает неизвестные локали в 404.
 * Всё нерусское, кроме страницы проверки, middleware уводит редиректом.
 */
export function generateStaticParams() {
  return [{ lang: MAIN_LOCALE }];
}

/**
 * Canonical и hreflang здесь больше не задаются. Каждая страница объявляет их сама
 * через `mainAlternates()` или `vinAlternates()`; те две, что закрыты `noindex`,
 * не нуждаются ни в том, ни в другом. Общий блок на уровне layout молча приписывал
 * альтернативы на en/ar страницам, которых на этих языках не существует.
 */

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
