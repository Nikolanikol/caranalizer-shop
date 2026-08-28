import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { VIN_PATHS } from "./lib/seo";
import { SHOP_BASE, SHOP_LOCALE, isShopLocale } from "./lib/shop/urls";

const intlMiddleware = createMiddleware(routing);

/**
 * Прежний магазин: пути удалены и отвечают 410, а не редиректом.
 *
 * Раньше они отдавали 301 на kmotors.shop, чтобы накопленный поисковый сигнал перетёк
 * на вторую площадку. Проверено 26.08.2026 — не перетекал: `kmotors.shop/ru/parts/<что
 * угодно>` отдаёт 200 с `<meta name="robots" content="noindex">` и одну и ту же
 * generic-страницу хоть на настоящий артикул, хоть на выдуманный. Робот шёл по
 * редиректу и получал «не индексируй меня», то есть склеивать было не с чем.
 *
 * 410 говорит прямо: страницы больше нет. Из индекса такие адреса выпадают быстрее,
 * чем при 404, и робот почти не возвращается их перепроверять. Это единственный рычаг,
 * который у нас есть: в отчёте «обнаружена, не проиндексирована» лежит хвост прежнего
 * магазина на 307 755 адресов, инструмента «удалить хвост» не существует, и уходит он
 * сам — если адреса честно отвечают «удалено» и никуда не ведут.
 *
 * Оборотная сторона принята сознательно: остаток сигнала этих адресов теряется.
 * Терять там было уже нечего — цель редиректа сама стояла под noindex.
 *
 * ВАЖНО: не закрывать эти пути в robots.txt. Заблокированный адрес робот не обходит,
 * значит и 410 по нему не увидит, и адрес останется в отчёте навсегда. Правило общее:
 * ответ и `Disallow` несовместимы, выбирать надо одно.
 */
const LEGACY_SHOP =
  /^\/(?:(?:ru|en|ar)\/)?(?:parts(?:\/.*)?|catalog(?:\/.*)?|vehicles(?:\/.*)?|cart\/?|checkout\/?)$/;

/**
 * Страница для человека. Робот смотрит на код ответа, а посетителю по старой закладке
 * нужно объяснить, куда делся магазин, — поэтому не пустое тело.
 */
const GONE_PAGE = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Страница удалена — Caranalizer</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0f172a;
    color:#e2e8f0;font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
  main{max-width:32rem;padding:2rem;text-align:center}
  h1{font-size:1.5rem;margin:0 0 .75rem}
  p{margin:0 0 1.5rem;color:#94a3b8}
  a{display:inline-block;padding:.75rem 1.25rem;border-radius:.5rem;
    background:#38bdf8;color:#0f172a;text-decoration:none;font-weight:600}
</style></head>
<body><main>
  <h1>Этой страницы больше нет</h1>
  <p>Прежний каталог закрыт. Запчасти с корейских авторазборов теперь в новом разделе —
     18 655 деталей с поиском по артикулу.</p>
  <a href="/ru/zapchasti">Перейти в каталог запчастей</a>
</main></body></html>`;

/**
 * Заголовок, по которому next-intl узнаёт язык запроса. Имя внутреннее для пакета
 * (`HEADER_LOCALE_NAME` в next-intl), публичного экспорта у него нет — если после
 * обновления next-intl иноязычная страница проверки начнёт отдавать русский текст,
 * сверить константу здесь.
 */
const INTL_LOCALE_HEADER = "X-NEXT-INTL-LOCALE";

/** Страница проверки по VIN — она под en/ar и живёт по своему слагу. */
const FOREIGN_KEEP = VIN_PATHS.en;

/**
 * Правовые страницы и контакты доступны на всех локалях, а не только по-русски.
 *
 * Раньше их глотал общий редирект `/en|/ar → страница проверки`, и получалось вот что:
 * cookie-баннер на английской странице ссылается на политику обработки данных, а по
 * ссылке — 301 обратно на страницу проверки. То же у согласия в форме заявки раздела
 * запчастей: галочка ссылается на политику, до которой нельзя дойти. Согласие,
 * отсылающее к недоступному документу, — это не согласие.
 *
 * Английские и арабские тексты у этих страниц есть давно, их просто было не достать.
 *
 * Маркетинговые страницы (`/about`, `/faq`, `/how-it-works`, `/guides`) сюда не входят
 * намеренно: они по-прежнему уводят на страницу проверки. Оговорка: шапка и футер на
 * иноязычных страницах их всё равно показывают, и эти ссылки остаются редиректом —
 * чинить надо в навигации, а не здесь.
 */
const FOREIGN_LEGAL = ["/privacy", "/terms", "/contact"];

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

  // Прежний магазин: /parts, /catalog, /vehicles, /cart, /checkout — с языковым
  // префиксом и без. Подробности и почему именно 410 — в комментарии к LEGACY_SHOP.
  if (LEGACY_SHOP.test(pathname)) {
    return new NextResponse(GONE_PAGE, {
      status: 410,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
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

  /*
   * Язык из `SHOP_LOCALES` (сейчас `ru` и `en`) существует целиком — редирект его
   * не трогает вовсе.
   *
   * До 28.08.2026 всё под `/en` уводило на страницу проверки по VIN. Посылка была
   * «сайт одноязычный», и она оказалась неверной дважды: половина поисковых кликов
   * приходила на иноязычные адреса, а английские тексты у страниц были давно —
   * гайды, «о нас», FAQ и «как мы работаем» лежат в коде тремя локалями. То есть
   * редирект прятал готовый сайт, а не отсутствующий.
   *
   * `ar` пока остаётся свёрнутым: раздел запчастей на нём не открыт, и отдавать
   * арабоязычному посетителю сайт с русским каталогом внутри незачем. Ему доступны
   * страница проверки и правовые страницы; как `ar` попадёт в `SHOP_LOCALES`,
   * эта ветка перестанет его касаться сама.
   */
  const foreign = pathname.match(/^\/(en|ar)(\/.*)?$/);
  if (foreign) {
    const locale = foreign[1] as "en" | "ar";
    const rest = foreign[2] ?? "";
    const legal = FOREIGN_LEGAL.includes(rest);
    if (!isShopLocale(locale) && rest !== FOREIGN_KEEP && !legal) {
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
