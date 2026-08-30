/**
 * Куда вести за входом со страницы проверки по VIN.
 *
 * Отдельной функцией, а не выражением в разметке, ради одной ловушки: на `ar`
 * кабинета нет. Арабский свёрнут — middleware оставляет ему только страницу проверки
 * и правовые страницы, а `/ar/auth` отдаёт 301 обратно на проверку. То есть кнопка
 * «Войти» вернула бы человека ровно туда, откуда он её нажал, и это не выглядело бы
 * ошибкой — просто ничего не произошло.
 *
 * Поэтому арабского посетителя ведём в английский кабинет, а возвращаем всё равно
 * на его язык: адрес страницы проверки редирект пропускает на всех трёх локалях.
 *
 * Модуль самодостаточен (пути приходят аргументом) — иначе его не импортировать
 * напрямую в тесте под `--experimental-strip-types`.
 */

/** Локали, на которых существует кабинет. Совпадает с `SITE_LOCALES` из `lib/seo`. */
const LOCALES_WITH_AUTH = ['ru', 'en'] as const;

const FALLBACK_AUTH_LOCALE = 'en';

export type VinAuthLink = {
  /** Адрес возврата после входа — страница проверки на языке посетителя. */
  back: string;
  /** Адрес формы входа с уже подставленным возвратом. */
  href: string;
};

/**
 * @param locale язык страницы (`ru`, `en` или `ar`)
 * @param vinPath путь страницы проверки на этом языке — из `VIN_PATHS`
 */
export function vinAuthLink(locale: string, vinPath: string): VinAuthLink {
  const back = `/${locale}${vinPath}`;
  const authLocale = (LOCALES_WITH_AUTH as readonly string[]).includes(locale)
    ? locale
    : FALLBACK_AUTH_LOCALE;

  return {
    back,
    href: `/${authLocale}/auth?mode=register&next=${encodeURIComponent(back)}`,
  };
}
