/**
 * Подписи стран сборки на языках страницы проверки.
 *
 * Страница трёхъязычная (`ru`, `en`, `ar`) — единственная такая на сайте, — поэтому
 * словарь тоже на три языка, а не на два.
 *
 * Живёт отдельно от `decode.ts` намеренно: там слой данных, и английской строки
 * «South Korea» в нём быть не должно — язык подставляется на границе показа. Это то же
 * правило, по которому каталог запчастей хранит русские термины донора как есть,
 * а переводит их `lib/shop/terms.ts`.
 *
 * Полноту сторожит `npm run vin:test`: он сверяет ключи с `VIN_COUNTRIES`, то есть
 * с тем, что реально встречается в таблице заводов. Добавите WMI с новой страной —
 * тест упадёт здесь, а не на живой странице.
 *
 * Марки не переводятся: они и в данных латиницей.
 */

export const VIN_LOCALES = ['ru', 'en', 'ar'] as const;
export type VinTextLocale = (typeof VIN_LOCALES)[number];

const COUNTRIES: Record<string, Record<VinTextLocale, string>> = {
  Canada: { ru: 'Канада', en: 'Canada', ar: 'كندا' },
  'Czech Republic': { ru: 'Чехия', en: 'Czech Republic', ar: 'التشيك' },
  Finland: { ru: 'Финляндия', en: 'Finland', ar: 'فنلندا' },
  Germany: { ru: 'Германия', en: 'Germany', ar: 'ألمانيا' },
  Italy: { ru: 'Италия', en: 'Italy', ar: 'إيطاليا' },
  Japan: { ru: 'Япония', en: 'Japan', ar: 'اليابان' },
  Mexico: { ru: 'Мексика', en: 'Mexico', ar: 'المكسيك' },
  Poland: { ru: 'Польша', en: 'Poland', ar: 'بولندا' },
  Slovakia: { ru: 'Словакия', en: 'Slovakia', ar: 'سلوفاكيا' },
  'South Korea': { ru: 'Южная Корея', en: 'South Korea', ar: 'كوريا الجنوبية' },
  Spain: { ru: 'Испания', en: 'Spain', ar: 'إسبانيا' },
  Sweden: { ru: 'Швеция', en: 'Sweden', ar: 'السويد' },
  UK: { ru: 'Великобритания', en: 'United Kingdom', ar: 'المملكة المتحدة' },
  USA: { ru: 'США', en: 'USA', ar: 'الولايات المتحدة' },
};

/** Ключи словаря — для проверки полноты. */
export const TRANSLATED_COUNTRIES = Object.keys(COUNTRIES);

/**
 * Подпись страны. Незнакомая возвращается как есть: показать английское название
 * лучше, чем прочерк, — а тест к этому моменту уже упадёт.
 */
export function countryName(country: string | null, locale: string): string | null {
  if (!country) return null;
  const row = COUNTRIES[country];
  if (!row) return country;
  return row[(VIN_LOCALES as readonly string[]).includes(locale) ? (locale as VinTextLocale) : 'en'];
}
