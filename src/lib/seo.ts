/**
 * Canonical и hreflang — один сборщик на весь сайт.
 *
 * До этого адрес сайта был скопирован собственной константой в тринадцать файлов,
 * а список языковых альтернатив — в десять. Любая правка требовала найти все копии,
 * и при переезде домена или смене набора языков одна из них оставалась старой.
 *
 * Сайт одноязычный: страницы существуют только на русском, и объявлять для них
 * альтернативы на en/ar значило бы врать карте сайта. Исключение одно — страница
 * проверки по VIN, она есть на трёх языках и у каждого свой путь.
 */

import { SITE_URL } from "@/lib/site";

/** Единственный язык сайта. Всё, кроме страницы проверки, существует только на нём. */
export const MAIN_LOCALE = "ru";

/**
 * Пути страницы проверки по локали — единственное место, где они заданы: отсюда их
 * берут карта сайта, редиректы в middleware и метаданные страницы.
 *
 * Транслит русскому посетителю понятен, англоязычному нет — поэтому у локалей разные
 * слаги. Те же строки заданы в `pathnames` конфига next-intl: менять в обоих местах.
 */
export const VIN_PATHS = {
  ru: "/proverka-avto-po-vin",
  en: "/koreancar-vin-check",
  ar: "/koreancar-vin-check",
} as const;

export type VinLocale = keyof typeof VIN_PATHS;

/** Абсолютный адрес страницы на основном языке. `path` — с ведущим слэшем или пустой. */
export function mainUrl(path = ""): string {
  return `${SITE_URL}/${MAIN_LOCALE}${path}`;
}

/**
 * Метаданные одноязычной страницы: canonical на русскую версию, без hreflang.
 *
 * Отсутствие `languages` здесь не забывчивость: других языковых версий у страницы
 * нет, и заявленная альтернатива увела бы Google на редирект.
 */
export function mainAlternates(path = ""): { canonical: string } {
  return { canonical: mainUrl(path) };
}

/**
 * Метаданные страницы проверки: canonical на свою локаль плюс полный набор
 * альтернатив. `x-default` указывает на русскую версию — основной рынок РФ.
 */
export function vinAlternates(locale: string): {
  canonical: string;
  languages: Record<string, string>;
} {
  const current = (locale in VIN_PATHS ? locale : MAIN_LOCALE) as VinLocale;

  return {
    canonical: `${SITE_URL}/${current}${VIN_PATHS[current]}`,
    languages: {
      ru: `${SITE_URL}/ru${VIN_PATHS.ru}`,
      en: `${SITE_URL}/en${VIN_PATHS.en}`,
      ar: `${SITE_URL}/ar${VIN_PATHS.ar}`,
      "x-default": `${SITE_URL}/ru${VIN_PATHS.ru}`,
    },
  };
}
