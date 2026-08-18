import 'server-only';
import type { Rates } from './pricing';

/**
 * Курсы ЦБ. Единственное место, где цена трогает сеть.
 *
 * Оба курса приходят одним запросом: в дневном XML ЦБ есть и вона, и доллар.
 * Второй запрос ради второй валюты был бы лишним — и разъехался бы по времени
 * с первым.
 *
 * Кэширует Next, а не мы. `revalidate: 86400` кладёт ответ в Data Cache на сутки:
 * за всю сборку 994 страниц в ЦБ уходит один запрос, остальные читают кэш. Своего
 * кэша в модуле быть не должно — он бы прятал `fetch` от Next, маршрут не получил бы
 * интервал ревалидации, и курс на пререндеренных карточках замер бы на моменте сборки.
 */

/**
 * Запасные курсы: ЦБ на 18 августа 2026.
 *
 * Нужны не для красоты: без них недоступный API ЦБ уронил бы сборку всех 967 карточек.
 * Они же попадут в цены, если ЦБ будет лежать, — значит при заметном расхождении
 * их надо обновлять руками.
 */
export const FALLBACK_RATES: Rates = { rubPerKrw: 0.0601, rubPerUsd: 85 };

const CBR_DAILY_XML = 'https://www.cbr.ru/scripts/XML_daily.asp';
const ONE_DAY_SECONDS = 86_400;

/** Границы правдоподобия: битый ответ не должен превратиться в цену на витрине. */
const PLAUSIBLE: Record<string, [number, number]> = {
  KRW: [0.01, 1],
  USD: [10, 1000],
};

/**
 * Курс одной единицы валюты в рублях.
 *
 * Ответ приходит в windows-1251, а `text()` декодирует как UTF-8 — кириллица в `Name`
 * при этом ломается, и это неважно: `CharCode`, `Nominal` и `Value` целиком ASCII.
 * Перекодировать ради полей, которые мы не читаем, не нужно.
 *
 * Номинал обязателен к учёту: вона котируется за 1000 единиц, доллар за одну.
 */
export function parseRate(xml: string, charCode: keyof typeof PLAUSIBLE): number | null {
  const block = xml.split('<Valute').find((chunk) => chunk.includes(`<CharCode>${charCode}</CharCode>`));
  if (!block) return null;

  const value = block.match(/<Value>([\d.,\s]+)<\/Value>/)?.[1];
  if (!value) return null;

  // У ЦБ дробная часть через запятую, разряды разделены неразрывным пробелом.
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  const nominal = Number(block.match(/<Nominal>(\d+)<\/Nominal>/)?.[1] ?? 1) || 1;
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  const rate = parsed / nominal;
  const [min, max] = PLAUSIBLE[charCode];
  return rate >= min && rate <= max ? rate : null;
}

/** Курсы для расчёта цены. Отказ ЦБ — не ошибка: возвращаются запасные. */
export async function getRates(): Promise<Rates> {
  try {
    const response = await fetch(CBR_DAILY_XML, { next: { revalidate: ONE_DAY_SECONDS } });
    if (!response.ok) throw new Error(`ЦБ ответил ${response.status}`);

    const xml = await response.text();
    const rubPerKrw = parseRate(xml, 'KRW');
    const rubPerUsd = parseRate(xml, 'USD');
    if (rubPerKrw === null || rubPerUsd === null) {
      throw new Error('в ответе ЦБ нет правдоподобных курсов KRW и USD');
    }

    return { rubPerKrw, rubPerUsd };
  } catch (error) {
    console.error('[rates] курсы ЦБ недоступны, берём запасные:', error);
    return FALLBACK_RATES;
  }
}
