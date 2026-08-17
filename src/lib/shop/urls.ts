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
 * Полный каталог. Отдельная страница, а не сам корень раздела: на корне лежит витрина,
 * и если сделать корнем полный список, он совпадёт с /zapchasti/zadnie-fonari на 95%
 * (967 позиций против 915) — две страницы начнут конкурировать за одни и те же запросы.
 */
export const SHOP_CATALOG = `${SHOP_BASE}/katalog`;

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
