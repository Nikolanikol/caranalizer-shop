import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Магазин переехал на K-Axis: товарные разделы отдают постоянный 301,
// чтобы накопленный поисковый сигнал перетёк на kmotors.shop.
// ВАЖНО: цели редиректов — чистые URL без UTM: /{lang}/parts на KMotors
// ставит noindex при любом query-параметре.
const KMOTORS = "https://www.kmotors.shop";

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

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
