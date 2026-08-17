/**
 * Единственное место, где воны превращаются в рубли.
 *
 * Раньше курс жил в трёх местах — 0.0745 в константах витрины, 0.075 в сервере заявок
 * и фактические 0.1875, зашитые в сами данные. Из-за этого цена в списке, в карточке
 * и в корзине могла разъехаться. Формулу не копировать по компонентам.
 *
 * Каталог хранит только воны. Меняется число здесь — пересчитывается вся витрина сразу,
 * пересобирать data/catalog.json не нужно.
 */

/** Курс: сколько рублей в одном воне. */
export const RUB_PER_KRW = 0.075;

/**
 * Множитель цены: закупаем за 100 — продаём за 150.
 * Не менять «на глаз»: 2.5, стоявшие здесь раньше, продавали втрое дороже закупки.
 */
export const MARKUP = 1.5;

export function priceRub(priceKrw: number): number {
  return Math.round(priceKrw * RUB_PER_KRW * MARKUP);
}

export function formatRub(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

/** Цена товара для показа: «19 800 ₽». */
export function formatPartPrice(priceKrw: number): string {
  return formatRub(priceRub(priceKrw));
}

export function formatKrw(priceKrw: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(priceKrw);
}
