import { Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { MAIN_LOCALE } from "@/lib/seo";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import { Toaster } from "sonner";
import { MessengerButtons } from "@/components/MessengerButtons";
import { KmotorsTopBar } from "@/components/KmotorsTopBar";
import { CartProvider } from "@/components/shop/cart-context";
import { AuthProvider } from "@/components/auth/auth-context";
import { getRates } from "@/lib/shop/rates";
import { CartDrawer } from "@/components/shop/cart-drawer";

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

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-heading",
  display: "swap",
});

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

  /**
   * Сообщаем next-intl язык явно, вместо того чтобы он читал его из заголовков запроса.
   * Без этого вызова любой `useTranslations` внизу дерева обращается к `headers()`,
   * а это переводит страницу в динамический рендер — статики не было ни у одной.
   */
  setRequestLocale(lang as Locale);

  const messages = await getMessages();
  const tn = await getTranslations({ locale: lang as Locale, namespace: "nav" });
  // Курсы ЦБ нужны корзине, а она клиентская: сама сходить за ними на сервер не может.
  const rates = await getRates();
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning className={spaceGrotesk.variable}>
      <body className="flex flex-col min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:start-2 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        {tn("skipToContent")}
      </a>
      <NextIntlClientProvider messages={messages}>
        {/*
          Корзина поднята сюда из layout раздела запчастей: её кнопка переехала в шапку,
          а шапка лежит выше по дереву — контекст течёт вниз, и из раздела она была
          недоступна. Цена подъёма — чтение localStorage на всех страницах, включая
          проверку по VIN; взамен отложенные детали доступны с любой страницы.

          CartDrawer сидит на z-[60] и потому не конфликтует с cookie-баннером
          и кнопками мессенджеров: на z-50 оба, и они рендерятся позже.
        */}
        {/*
          Провайдер входа стоит выше шапки: кнопка «Войти» и кабинет живут в ней.
          Он клиентский и сессию читает из localStorage — статику страниц это
          не ломает, в отличие от cookie, за которыми пришлось бы идти на сервер.
        */}
        <AuthProvider>
          <CartProvider rates={rates}>
            <KmotorsTopBar />
            <Header />
            <main id="main-content" className="flex-1">{children}</main>
            <Footer />
            <CookieBanner />
            <MessengerButtons />
            <CartDrawer />
          </CartProvider>
        </AuthProvider>
        <Toaster theme="dark" position="top-center" richColors />
      </NextIntlClientProvider>

      <Script src="https://www.googletagmanager.com/gtag/js?id=G-7MZ9ET3VPK" strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-7MZ9ET3VPK');`}
      </Script>
      <Script id="clarity-init" strategy="beforeInteractive">
        {`window.clarity=window.clarity||function(){(window.clarity.q=window.clarity.q||[]).push(arguments)};`}
      </Script>
      <Script src="https://www.clarity.ms/tag/xc2ligwlp9" strategy="afterInteractive" />
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=108825981','ym');ym(108825981,'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true,ecommerce:"dataLayer"});`}
      </Script>
      <noscript>
        <div>
          {/* Счётчик Метрики для браузеров без JS. Именно <img>: next/image рисует
              разметку и грузит через свой загрузчик, а здесь нужен один голый запрос
              к чужому домену — оптимизировать нечего. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://mc.yandex.ru/watch/108825981" style={{ position: 'absolute', left: '-9999px' }} alt="" />
        </div>
      </noscript>
      </body>
    </html>
  );
}
