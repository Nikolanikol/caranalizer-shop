/**
 * Единственное место, где считается цена. Формулу по компонентам не копировать:
 * именно от этого цена в списке, в карточке и в корзине однажды разъехалась.
 *
 * Порядок один и обратного не бывает: **воны донора → наценка в вонах → перевод
 * по курсу ЦБ → округление**. Наценка живёт в валюте закупки, поэтому не зависит
 * от курса дня: сколько бы ни стоила вона, продаём мы за полторы закупочные цены.
 *
 * Каталог хранит только воны — ни рублёвой, ни долларовой цены в данных нет намеренно.
 *
 * **ЦЕНА ОФЕРТЫ — ДОЛЛАР** (с 28.08.2026). До этого покупателю показывался рубль,
 * а доллар шёл справочным, со знаком «≈». Раздел открыт на международный рынок,
 * и рублёвая цена там ничего не значит: покупатель из Италии платит по SWIFT или
 * PayPal. Поэтому доллар стал ценой, а «≈» из его формата убран — приблизительной
 * цены в оферте быть не может.
 *
 * Рублёвый расчёт остался и никуда не денется: он нужен в заявке менеджеру, который
 * ведёт и российских покупателей. Но на витрину он не выходит.
 *
 * Что стоит знать про устойчивость доллара. Он считается кросс-курсом
 * `(₽/₩) ÷ (₽/$)` из одного снимка ЦБ, поэтому **от курса рубля не зависит вовсе**:
 * рубль сокращается. Двигает цену только настоящее движение воны к доллару, и при
 * сдвиге на 1% меняет шаг примерно четверть позиций (замер по 34 724 экземплярам).
 * Это допустимо ровно потому, что оферта у нас — «заявка, а не оплата»: итоговую
 * сумму подтверждает менеджер до выкупа. Если понадобится устойчивее — рычаг один,
 * укрупнить `USD_STEP`.
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

/**
 * Цена оферты. Знака «≈» здесь больше нет намеренно: доллар перестал быть справочным
 * 28.08.2026. Если понадобится показать доллар приблизительным — заводите отдельную
 * функцию, а эту не трогайте, иначе «≈» расползётся обратно по всей витрине.
 */
export function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

/** Рубль в заявке менеджеру — там он справочный, отсюда «≈». На витрину не выходит. */
export function formatRubApprox(value: number): string {
  return `≈ ${formatRub(value)}`;
}

/**
 * Цена товара для показа: «$240». Единственная цена, которую видит покупатель.
 *
 * Рублёвого аналога здесь нет намеренно — был `formatPartPrice`, и его удаление
 * и есть переход на долларовую оферту. Нужен рубль для заявки — считайте `priceRub`
 * и подписывайте `formatRubApprox`.
 */
export function formatPartPrice(priceKrw: number, rates: Rates): string {
  return formatUsd(priceUsd(priceKrw, rates));
}

export function formatKrw(priceKrw: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(priceKrw);
}
