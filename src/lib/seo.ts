/**
 * Canonical и hreflang — один сборщик на весь сайт.
 *
 * До этого адрес сайта был скопирован собственной константой в тринадцать файлов,
 * а список языковых альтернатив — в десять. Любая правка требовала найти все копии,
 * и при переезде домена или смене набора языков одна из них оставалась старой.
 *
 * Языков у сайта два — `ru` и `en` (`SITE_LOCALES`). Арабский свёрнут: на нём живёт
 * только страница проверки по VIN, и объявлять для остальных страниц арабскую
 * альтернативу значило бы увести Google на редирект.
 *
 * Страница проверки стоит особняком: она есть на трёх языках, и путь у каждого свой.
 */

import { SITE_URL } from "@/lib/site";

/** Основной язык: canonical по умолчанию, `x-default` и адрес в заявках. */
export const MAIN_LOCALE = "ru";

/**
 * Языки, на которых сайт существует целиком. До 28.08.2026 здесь был только русский,
 * и это было неправдой: английские тексты у страниц лежали в коде, их прятал редирект
 * `/en → страница проверки`. Арабский сюда не входит — раздел запчастей на нём
 * не открыт, и отдавать арабский сайт с русским каталогом внутри незачем.
 */
export const SITE_LOCALES = ["ru", "en"] as const;

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
 * Метаданные страницы сайта: canonical на свою локаль плюс hreflang по `SITE_LOCALES`.
 *
 * Локаль обязательна к передаче там, где страница существует на обоих языках: без неё
 * canonical английской страницы указывал бы на русскую, и Google выбросил бы её
 * из индекса как дубль. Без аргумента поведение прежнее — canonical на русскую
 * и полный набор альтернатив.
 */
export function mainAlternates(
  path = "",
  locale: string = MAIN_LOCALE,
): { canonical: string; languages: Record<string, string> } {
  const current = (SITE_LOCALES as readonly string[]).includes(locale) ? locale : MAIN_LOCALE;
  const languages: Record<string, string> = {};
  for (const one of SITE_LOCALES) languages[one] = `${SITE_URL}/${one}${path}`;
  languages["x-default"] = mainUrl(path);

  return { canonical: `${SITE_URL}/${current}${path}`, languages };
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
