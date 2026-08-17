import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { VIN_PATHS } from "./lib/seo";
import { SHOP_BASE, SHOP_LOCALE } from "./lib/shop/urls";

const intlMiddleware = createMiddleware(routing);

// Магазин переехал на K-Axis: товарные разделы отдают постоянный 301,
// чтобы накопленный поисковый сигнал перетёк на kmotors.shop.
// ВАЖНО: цели редиректов — чистые URL без UTM: /{lang}/parts на KMotors
// ставит noindex при любом query-параметре.
const KMOTORS = "https://www.kmotors.shop";

/**
 * Заголовок, по которому next-intl узнаёт язык запроса. Имя внутреннее для пакета
 * (`HEADER_LOCALE_NAME` в next-intl), публичного экспорта у него нет — если после
 * обновления next-intl иноязычная страница проверки начнёт отдавать русский текст,
 * сверить константу здесь.
 */
const INTL_LOCALE_HEADER = "X-NEXT-INTL-LOCALE";

/** Единственный путь, который существует под en/ar — страница проверки по VIN. */
const FOREIGN_KEEP = VIN_PATHS.en;

/**
 * Внутреннее имя маршрута страницы проверки — папка в app/[lang].
 *
 * Иноязычный слаг (`/koreancar-vin-check`) переписываем на него, а не отдаём вторым
 * маршрутом: путь у локалей разный, страница одна. `pathnames` из next-intl тут не
 * подошёл: объявление хотя бы одного локализованного пути делает типы `Link` строгими,
 * и тогда пришлось бы перечислить все маршруты, включая динамические адреса магазина,
 * которые собираются строками в lib/shop/urls.ts.
 */
const VIN_ROUTE = VIN_PATHS.ru;

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /:lang?/parts[/slug] → тот же адрес на KMotors. Форматы слага идентичны:
  // part_number или id-N; legacy "PN--name"/"PN--" KMotors нормализует сам.
  //
  // Слаг необязателен: /parts и /ru/parts — индексная страница прежнего каталога,
  // и у KMotors ровно такой адрес есть. Без этого они отдавали 404, то есть
  // накопленный по ним сигнал просто терялся вместо перехода на вторую площадку.
  const parts = pathname.match(/^\/(?:(ru|en|ar)\/)?parts(?:\/(.*))?$/);
  if (parts) {
    const lang = parts[1] ?? "ru";
    const slug = (parts[2] ?? "").replace(/-+$/, "");
    const target = slug ? `${KMOTORS}/${lang}/parts/${slug}` : `${KMOTORS}/${lang}/parts`;
    return NextResponse.redirect(target, 301);
  }

  // Каталог и страницы моделей → каталог запчастей KMotors (пер-категорийных
  // и пер-модельных URL у KMotors нет)
  const listing = pathname.match(/^\/(?:(ru|en|ar)\/)?(?:catalog|vehicles)(?:\/.*)?$/);
  if (listing) {
    const lang = listing[1] ?? "ru";
    return NextResponse.redirect(`${KMOTORS}/${lang}/parts`, 301);
  }

  // Корзина/чекаут упразднены → на главную соответствующего языка
  const shop = pathname.match(/^\/(?:(ru|en|ar)\/)?(?:cart|checkout)\/?$/);
  if (shop) {
    const url = req.nextUrl.clone();
    url.pathname = `/${shop[1] ?? "ru"}`;
    url.search = "";
    return NextResponse.redirect(url, 301);
  }

  // Прежний полный каталог: витрина получила фильтр, сортировку и пагинацию, после чего
  // /zapchasti/katalog стал её точной копией — те же 967 позиций, две страницы за одни
  // и те же запросы. Параметры сохраняем: фильтр и поиск на витрине те же самые.
  const katalog = pathname.match(/^\/(?:(ru|en|ar)\/)?zapchasti\/katalog\/?$/);
  if (katalog) {
    const url = req.nextUrl.clone();
    url.pathname = `/${katalog[1] ?? SHOP_LOCALE}${SHOP_BASE}`;
    return NextResponse.redirect(url, 301);
  }

  // Старые адреса страниц проверки: /check и /report склеены в одну страницу.
  const merged = pathname.match(/^\/(?:(ru|en|ar)\/)?(?:check|report)\/?$/);
  if (merged) {
    const locale = (merged[1] ?? "ru") as "ru" | "en" | "ar";
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${VIN_PATHS[locale]}`;
    url.search = "";
    return NextResponse.redirect(url, 301);
  }

  // Сайт одноязычный, и многоязычна ровно одна страница — проверка по VIN. Всё
  // остальное под en/ar не существует: уводим на ту единственную страницу, которая
  // на этом языке есть. 404 здесь был бы честнее по букве, но бесполезнее для
  // посетителя, а накопленного сигнала у этих адресов нет — за три месяца ни один
  // из них не собрал в поиске ни одного показа.
  const foreign = pathname.match(/^\/(en|ar)(\/.*)?$/);
  if (foreign) {
    const locale = foreign[1] as "en" | "ar";
    const rest = foreign[2] ?? "";
    if (rest !== FOREIGN_KEEP) {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}${FOREIGN_KEEP}`;
      url.search = "";
      return NextResponse.redirect(url, 301);
    }
  }

  // /en/koreancar-vin-check → внутренний /en/proverka-avto-po-vin. Адрес в браузере
  // не меняется: посетитель остаётся на своём слаге, отдаём ему ту же страницу.
  const vin = pathname.match(/^\/(en|ar)(\/.*)?$/);
  if (vin && vin[2] === FOREIGN_KEEP) {
    const locale = vin[1];
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${VIN_ROUTE}`;

    // Локаль приходится выставлять руками: этот `rewrite` возвращается до
    // intlMiddleware, а именно она ставит заголовок, по которому next-intl
    // определяет язык (`getRequestLocale` читает его через next/headers).
    // Без этого страница отдавалась с правильным <title>, потому что метаданные
    // берут язык из params, но со всем остальным содержимым по-русски: h1,
    // тексты, <html lang> и dir — язык падал на defaultLocale.
    const headers = new Headers(req.headers);
    headers.set(INTL_LOCALE_HEADER, locale);
    return NextResponse.rewrite(url, { request: { headers } });
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
