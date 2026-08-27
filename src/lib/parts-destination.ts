/**
 * Куда ведёт «запчасти» — одно правило на весь сайт.
 *
 * У нас две площадки, и товар у них разный: на caranalizer лежат **б/у** детали
 * с корейских разборов, на kmotors.shop — **новые** оригинальные по партномеру.
 *
 * Правило: если раздел существует на языке посетителя (`SHOP_LOCALES`) — ведём
 * к себе, иначе на kmotors. Раньше эти ссылки стояли по компонентам вразнобой,
 * и на странице своего же магазина висел баннер чужого каталога.
 *
 * Развилка была помечена временной — считалось, что сайт сожмётся до одного языка.
 * Вышло наоборот: 27.08.2026 раздел открыт на `en`, потому что половина поисковых
 * кликов приходила на иноязычные адреса. Отправлять их на kmotors было прямо вредно:
 * человек искал б/у деталь, а попадал в каталог новых.
 *
 * `ar` пока уходит на kmotors — не по замыслу, а потому что раздел на нём ещё
 * не включён. Как включится, попадёт в `SHOP_LOCALES`, и эта ветка учтёт его сама.
 */

import { SHOP_BASE, isShopLocale } from "@/lib/shop/urls";
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
  if (isShopLocale(locale)) {
    return { href: SHOP_BASE, external: false };
  }

  return { href: kmotorsUrl(locale, "parts", medium, campaign), external: true };
}

/** Продаём ли мы запчасти сами на этом языке. */
export function hasOwnPartsShop(locale: string): boolean {
  return isShopLocale(locale);
}
