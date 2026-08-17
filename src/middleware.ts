import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { VIN_PATHS } from "./lib/seo";

const intlMiddleware = createMiddleware(routing);

// Магазин переехал на K-Axis: товарные разделы отдают постоянный 301,
// чтобы накопленный поисковый сигнал перетёк на kmotors.shop.
// ВАЖНО: цели редиректов — чистые URL без UTM: /{lang}/parts на KMotors
// ставит noindex при любом query-параметре.
const KMOTORS = "https://www.kmotors.shop";

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

  // /:lang?/parts/slug → тот же slug на KMotors (форматы идентичны:
  // part_number или id-N; legacy "PN--name"/"PN--" KMotors нормализует сам)
  const parts = pathname.match(/^\/(?:(ru|en|ar)\/)?parts\/(.+)$/);
  if (parts) {
    const lang = parts[1] ?? "ru";
    const slug = parts[2].replace(/-+$/, "");
    return NextResponse.redirect(`${KMOTORS}/${lang}/parts/${slug}`, 301);
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
    const url = req.nextUrl.clone();
    url.pathname = `/${vin[1]}${VIN_ROUTE}`;
    return NextResponse.rewrite(url);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
