/**
 * Ссылки на kmotors.shop — вторую нашу площадку: новые оригинальные запчасти,
 * авто из Кореи под ключ, калькулятор растаможки.
 *
 * Один сборщик на весь сайт. До этого выбор языка был скопирован в KmotorsTopBar
 * и KmotorsBanner, а в футере и на главной калькулятор был зашит на `/ru/` —
 * англоязычный посетитель попадал на русскую страницу.
 */

/** Языки, которые есть на kmotors.shop: /ru, /en, /ar отдают 200 и свой lang. */
const KMOTORS_LOCALES = ["ru", "en", "ar"];

const KMOTORS = "https://www.kmotors.shop";

/**
 * Адрес раздела kmotors для текущей локали.
 *
 * `path` — без ведущего слэша (`parts`, `catalog`, `calculator`) или пустая строка
 * для главной. Незнакомую локаль уводим на английскую версию.
 *
 * UTM обязательны: по ним в статистике kmotors видно, какой блок какого языка
 * привёл переход. ВАЖНО: цель должна оставаться чистым URL без лишних параметров —
 * `/{lang}/parts` на kmotors ставит noindex при любом постороннем query.
 */
export function kmotorsUrl(
  locale: string,
  path: string,
  medium: string,
  campaign?: string
): string {
  const lang = KMOTORS_LOCALES.includes(locale) ? locale : "en";
  const query = new URLSearchParams({ utm_source: "caranalizer", utm_medium: medium });
  if (campaign) query.set("utm_campaign", campaign);

  const segment = path ? `/${path}` : "";
  return `${KMOTORS}/${lang}${segment}?${query}`;
}
