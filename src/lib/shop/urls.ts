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

/** Язык у магазина один: каталог и карточки товаров существуют только на русском. */
export const SHOP_LOCALE = 'ru';

/** Абсолютный адрес с языковым префиксом — для canonical, sitemap и заявок. */
export function shopUrl(path: string, base: string): string {
  return `${base}/${SHOP_LOCALE}${path}`;
}

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
  search?: string;
  sort?: string;
  page?: number;
}): string {
  const query = new URLSearchParams();
  for (const key of ['brand', 'model', 'side', 'position', 'search', 'sort'] as const) {
    const value = params[key];
    if (value) query.set(key, value);
  }
  if (params.page && params.page > 1) query.set('page', String(params.page));

  const base = params.base || SHOP_BASE;
  const search = query.toString();
  return search ? `${base}?${search}` : base;
}
