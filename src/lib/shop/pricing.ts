/**
 * Единственное место, где считается цена. Формулу по компонентам не копировать:
 * именно от этого цена в списке, в карточке и в корзине однажды разъехалась.
 *
 * Порядок один и обратного не бывает: **воны донора → наценка в вонах → перевод
 * по курсу ЦБ → округление**. Наценка живёт в валюте закупки, поэтому не зависит
 * от курса дня: сколько бы ни стоила вона, продаём мы за полторы закупочные цены.
 *
 * Каталог хранит только воны — рублёвой цены в данных нет намеренно.
 */

/** Множитель цены: закупаем за 100 — продаём за 150. */
export const MARKUP = 1.5;

/** Шаг округления цены: рубли — до сотен, доллары — до десятков. */
const RUB_STEP = 100;
const USD_STEP = 10;

/** Курсы ЦБ на день расчёта. Тянет их `lib/shop/rates.ts`, здесь — только арифметика. */
export interface Rates {
  /** Сколько рублей в одной воне. */
  rubPerKrw: number;
  /** Сколько рублей в одном долларе. */
  rubPerUsd: number;
}

/**
 * Округление к ближайшему шагу, но не ниже одного шага.
 *
 * Нижняя граница — не перестраховка. У двух позиций донора цена стоит 100 и 120 вон
 * (явная ошибка в выгрузке): без границы округление до сотен дало бы 0 ₽,
 * и витрина предложила бы деталь бесплатно.
 */
function roundToStep(value: number, step: number): number {
  return Math.max(step, Math.round(value / step) * step);
}

/** Цена продажи в вонах: закупка донора с наценкой. Из неё считаются обе валюты. */
export function salePriceKrw(priceKrw: number): number {
  return priceKrw * MARKUP;
}

export function priceRub(priceKrw: number, rates: Rates): number {
  return roundToStep(salePriceKrw(priceKrw) * rates.rubPerKrw, RUB_STEP);
}

export function priceUsd(priceKrw: number, rates: Rates): number {
  return roundToStep((salePriceKrw(priceKrw) * rates.rubPerKrw) / rates.rubPerUsd, USD_STEP);
}

export function formatRub(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

/** Доллар всегда справочный — отсюда «≈» в самом формате, чтобы его не забыли поставить. */
export function formatUsd(value: number): string {
  return `≈ ${new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)}`;
}

/** Цена товара для показа: «5 000 ₽». */
export function formatPartPrice(priceKrw: number, rates: Rates): string {
  return formatRub(priceRub(priceKrw, rates));
}

/** Та же цена в долларах: «≈ $60». */
export function formatPartPriceUsd(priceKrw: number, rates: Rates): string {
  return formatUsd(priceUsd(priceKrw, rates));
}

export function formatKrw(priceKrw: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(priceKrw);
}
