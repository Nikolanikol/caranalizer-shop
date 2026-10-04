import type { AutoPart, PartCategory } from '@/types/part';

/**
 * Адреса. Единственное место, где путь превращается в строку — по компонентам не хардкодим.
 *
 * Файл намеренно БЕЗ `server-only`, в отличие от lib/shop/catalog.ts: корзина живёт
 * в браузере, а ей нужен полный путь товара — по одному слагу товар не опознать.
 *
 * Пути здесь БЕЗ языкового префикса: его подставляет `Link` из @/i18n/navigation.
 * Абсолютный адрес (canonical, карта сайта, заявка в Telegram) собирается через shopUrl().
 *
 * Иерархия сужается сегмент за сегментом, и каждый уровень — настоящая страница:
 *   /zapchasti                                                          витрина
 *   /zapchasti/zadnie-fonari                                            категория
 *   /zapchasti/zadnie-fonari/bmw                                        марка
 *   /zapchasti/zadnie-fonari/bmw/5-series                               модель
 *   /zapchasti/zadnie-fonari/bmw/5-series/vnutrenniy-pravyy-63217376474 товар
 *
 * Особняком стоит страница артикула:
 *   /zapchasti/oem/92101T1100                                           совместимость
 * Она не уровень иерархии, а вход сбоку — по номеру, а не по машине.
 */

/**
 * Корень магазина внутри caranalizer.
 *
 * Не /parts и не /catalog: оба пути заняты постоянными редиректами на kmotors.shop
 * (см. middleware) — там доживает свой век прежний магазин, и перехватывать эти
 * адреса заново значит разворачивать уже отданный поисковый сигнал.
 */
export const SHOP_BASE = '/zapchasti';

/**
 * Прежний адрес полного каталога. Страницы по нему больше нет: витрина раздела получила
 * фильтр, сортировку и пагинацию, после чего каталог стал её точной копией — те же 967
 * позиций, две страницы за одни и те же запросы. Теперь `/zapchasti/katalog` отдаёт 301
 * на витрину (см. middleware), а константа осталась только чтобы источник редиректа
 * не был строкой в двух местах.
 */
export const SHOP_CATALOG_LEGACY = `${SHOP_BASE}/katalog`;

/**
 * Страница артикула: на каких машинах встречается номер.
 *
 * Сегмент `oem` статический, поэтому Next разбирает его раньше динамического
 * `[category]` — столкновения с `/zapchasti/<категория>/<марка>` не будет.
 *
 * Номер в адрес идёт как есть, в верхнем регистре: именно так его печатают в поиске
 * и именно так он лежит в базе. Разделители донор ставит по-разному, поэтому
 * страница сама ищет и по очищенному виду тоже.
 */
export function oemUrl(oemNumber: string): string {
  return `${SHOP_BASE}/oem/${encodeURIComponent(oemNumber.toUpperCase())}`;
}

/**
 * Языки раздела запчастей.
 *
 * Раздел был одноязычным до 27.08.2026, и посылка звучала так: каталог приходит
 * от донора по-русски, а иноязычный покупатель обслуживается на kmotors. Данные
 * Search Console её опровергли — половина кликов приходит на `/en/` (29%) и `/ar/` (21%),
 * а kmotors торгует **новыми** деталями, и б/у покупателю там нечего купить.
 *
 * Переводить при этом почти нечего: свободной прозы в каталоге нет, заголовок собирается
 * из типа детали, марки, модели и года, а состояние и опции приходят из закрытых наборов.
 * Весь словарь — 60 терминов в `lib/shop/terms.ts`.
 *
 * `ar` пока не включён: решено начать с `en`, инфраструктура под него та же.
 */
export const SHOP_LOCALES = ['ru', 'en'] as const;

/**
 * Язык по умолчанию. Нужен там, где локали нет и взять её неоткуда: заявка в Telegram
 * (менеджер читает по-русски независимо от языка покупателя), карта сайта, редирект
 * упразднённого `/zapchasti/katalog`.
 */
export const SHOP_LOCALE = 'ru';

export function isShopLocale(value: string): value is (typeof SHOP_LOCALES)[number] {
  return (SHOP_LOCALES as readonly string[]).includes(value);
}

/**
 * Абсолютный адрес с языковым префиксом — для canonical, sitemap и заявок.
 *
 * Локаль по умолчанию русская: у большинства вызовов это заявка или карта сайта, где
 * язык покупателя ни при чём. Страницы, у которых есть английская версия, передают
 * свою — иначе `canonical` английской страницы указывал бы на русскую, и Google
 * выбросил бы её из индекса как дубль.
 */
export function shopUrl(path: string, base: string, locale: string = SHOP_LOCALE): string {
  return `${base}/${locale}${path}`;
}

/**
 * Canonical и hreflang одной страницы раздела.
 *
 * Обязательны оба: без `canonical` на свою локаль английская страница указывала бы
 * на русскую и выпала бы из индекса как дубль, а без `languages` Google не знает,
 * что это перевод, и склеивает их сам — как правило не в нашу пользу.
 *
 * `x-default` ведёт на русскую: она полнее по текстам разделов и старше по возрасту.
 */
export function shopAlternates(
  path: string,
  base: string,
  locale: string,
): { canonical: string; languages: Record<string, string> } {
  const current = isShopLocale(locale) ? locale : SHOP_LOCALE;
  const languages: Record<string, string> = {};
  for (const one of SHOP_LOCALES) languages[one] = shopUrl(path, base, one);
  languages['x-default'] = shopUrl(path, base, SHOP_LOCALE);

  return { canonical: shopUrl(path, base, current), languages };
}

/**
 * Страница листинга под номером из запроса — для canonical и заголовка.
 *
 * До 04.10.2026 вторая и дальше страницы листинга ставили canonical на первую —
 * то есть говорили Google «я копия первой». Он и не шёл по ним вглубь, а карточки
 * дальше пятнадцатой иначе как через карту сайта не находил: на проверке URL
 * Search Console отвечал «ссылающаяся страница не найдена». Теперь страница N
 * канонизирует саму себя — так рекомендует Google для пагинации.
 *
 * Канонизируется только чистый номер страницы. Адрес с фильтром (марка, сторона,
 * сортировка) остаётся вариантом выдачи, и canonical у него — на путь без параметров.
 */
export function listingPage(query: Record<string, string | string[] | undefined>): number {
  // Номер считается, только когда кроме него в адресе ничего нет: третья страница
  // с фильтром по стороне — другие товары, чем третья страница без фильтра, и сослаться
  // на неё canonical'ом значило бы назвать её копией чужой страницы.
  const others = Object.entries(query).some(([key, value]) => key !== 'page' && value !== undefined && value !== '');
  if (others) return 1;
  const page = Number(query.page);
  return Number.isInteger(page) && page > 1 ? page : 1;
}

export function pagedPath(path: string, page: number): string {
  return page > 1 ? `${path}?page=${page}` : path;
}

/** Заголовок страницы N: одинаковые заголовки у сотни страниц Google считает дублями. */
export function pagedTitle(title: string, page: number, locale: string): string {
  if (page <= 1) return title;
  return locale === 'en' ? `${title} — page ${page}` : `${title} — страница ${page}`;
}

/**
 * Раздел дисков — второй донор (skywheel.kr).
 *
 * Сегмент `diski` статический, поэтому Next разбирает его раньше динамического
 * `[category]`, и столкновения с `/zapchasti/<категория>/<марка>` нет — ровно как
 * у страницы артикула `oem`.
 *
 * Иерархии под ним нет намеренно: у диска не бывает стороны и позиции, а марка
 * и диаметр — это фильтр, а не уровень вложенности. Товаров сто двадцать,
 * и разводить их по страницам марок значило бы наплодить адресов с одной карточкой.
 */
export const WHEELS_BASE = `${SHOP_BASE}/diski`;

export function wheelUrl(slug: string): string {
  return `${WHEELS_BASE}/${slug}`;
}

/**
 * Ключ диска в корзине.
 *
 * Префикс обязателен. У партсфита ключ корзины — `product_no` донора, у диска —
 * `wr_id` объявления, и оба числовые строки. Сегодня они не пересекаются, но это
 * везение, а не устройство: сервер дочитывает цену из базы по этому ключу, и совпадение
 * означало бы счёт по цене чужого товара. Проверять пересечение при каждом скрапе
 * никто не станет — дешевле развести пространства имён раз и навсегда.
 */
export const wheelCartId = (id: string): string => `wheel-${id}`;

export const isWheelCartId = (id: string): boolean => id.startsWith('wheel-');

export const wheelIdFromCart = (id: string): string => id.replace(/^wheel-/, '');

export function partUrl(part: Pick<AutoPart, 'category' | 'brandSlug' | 'modelSlug' | 'slug'>): string {
  return `${SHOP_BASE}/${part.category}/${part.brandSlug}/${part.modelSlug}/${part.slug}`;
}

export function categoryUrl(category: PartCategory): string {
  return `${SHOP_BASE}/${category}`;
}

export function brandUrl(category: PartCategory, brandSlug: string): string {
  return `${SHOP_BASE}/${category}/${brandSlug}`;
}

export function modelUrl(category: PartCategory, brandSlug: string, modelSlug: string): string {
  return `${SHOP_BASE}/${category}/${brandSlug}/${modelSlug}`;
}

/**
 * Каталог с фильтрами. Марка и модель сюда не попадают — они сегменты пути, а не запрос,
 * иначе одна подборка была бы доступна по двум адресам сразу.
 *
 * Исключение — витрина раздела: категории там нет, поэтому пути под марку не существует
 * и фильтр остаётся параметром. Дублей это не создаёт: витрина канонизируется сама на себя.
 */
export function catalogUrl(params: {
  base?: string;
  brand?: string;
  model?: string;
  side?: string;
  position?: string;
  /** Только у дисков: диаметр в дюймах и «новое/б-у». У детали таких признаков нет. */
  diameter?: string;
  condition?: string;
  search?: string;
  sort?: string;
  page?: number;
}): string {
  const query = new URLSearchParams();
  for (const key of ['brand', 'model', 'side', 'position', 'diameter', 'condition', 'search', 'sort'] as const) {
    const value = params[key];
    if (value) query.set(key, value);
  }
  if (params.page && params.page > 1) query.set('page', String(params.page));

  const base = params.base || SHOP_BASE;
  const search = query.toString();
  return search ? `${base}?${search}` : base;
}
