/**
 * Куда ведёт «запчасти» — одно правило на весь сайт.
 *
 * У нас две площадки, и они не конкурируют: на caranalizer лежит б/у оптика
 * с корейских разборов (только по-русски, рынок РФ), на kmotors.shop — новые
 * оригинальные детали по партномеру, и он многоязычный.
 *
 * Отсюда правило: русскоязычному покупателю показываем свой раздел, всем
 * остальным — kmotors. Раньше эти ссылки стояли по компонентам вразнобой,
 * и на странице своего же магазина висел баннер чужого каталога.
 *
 * ВРЕМЕННОЕ: ветка на локаль исчезнет вместе с шагом B, когда сайт сожмётся
 * до одного языка (многоязычной останется только страница проверки по VIN).
 * Тогда здесь останется одна строка — свой раздел.
 */

import { SHOP_BASE, SHOP_LOCALE } from "@/lib/shop/urls";
import { kmotorsUrl } from "@/lib/kmotors";

export interface PartsDestination {
  href: string;
  /** Внешняя ссылка — открывать в новой вкладке и рисовать иконку выхода. */
  external: boolean;
}

/**
 * Адрес каталога запчастей для локали.
 *
 * `medium` и `campaign` уходят в UTM только для внешней ссылки: на своём разделе
 * метки не нужны, а в статистике kmotors по ним видно, откуда пришёл переход.
 */
export function partsDestination(
  locale: string,
  medium: string,
  campaign = "parts"
): PartsDestination {
  if (locale === SHOP_LOCALE) {
    return { href: SHOP_BASE, external: false };
  }

  return { href: kmotorsUrl(locale, "parts", medium, campaign), external: true };
}

/** Продаём ли мы запчасти сами на этом языке. */
export function hasOwnPartsShop(locale: string): boolean {
  return locale === SHOP_LOCALE;
}
