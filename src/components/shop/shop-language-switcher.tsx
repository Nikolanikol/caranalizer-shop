'use client';

import { Globe } from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { SHOP_BASE, SHOP_LOCALES } from '@/lib/shop/urls';

/**
 * Переключатель языка раздела запчастей. Компактный, в шапке, и только внутри раздела.
 *
 * Большой переключатель на странице проверки по VIN сюда не годится: он собирает адреса
 * из `VIN_PATHS`, потому что у той страницы слаг в каждой локали свой. У раздела пути
 * совпадают, и различается только языковой префикс — значит переключение сохраняет
 * ту же самую страницу, а не выбрасывает на витрину.
 *
 * Из шапки переключатель когда-то убрали, и по делу: он предлагал языки для страниц,
 * которых на них не существует, а в разделе запчастей нажатие EN давало 404. Теперь
 * раздел на английском есть, и довод перестал действовать — но ровно внутри раздела.
 * За его пределами компонент не рисуется вовсе, тем же приёмом, что и кнопка корзины.
 *
 * `hreflang` в разметке — сигнал для Google, а не навигация: живой человек по нему
 * переключиться не может. Без этой кнопки английская версия существовала бы только
 * для робота.
 */
export function ShopLanguageSwitcher() {
  const pathname = usePathname();
  const current = useLocale();

  const inShop = pathname === SHOP_BASE || pathname.startsWith(`${SHOP_BASE}/`);
  if (!inShop) return null;

  return (
    <div
      role="group"
      aria-label={current === 'en' ? 'Language' : 'Язык'}
      className="flex items-center gap-1 rounded-lg bg-elevated border border-border-subtle px-1.5 py-1"
    >
      <Globe className="h-3.5 w-3.5 text-text-muted shrink-0" aria-hidden />
      {SHOP_LOCALES.map((locale) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-current={active ? 'true' : undefined}
            onClick={() => {
              if (active) return;
              /*
               * Адрес собираем сами и уходим полной навигацией — так же, как переключатель
               * на странице проверки. Параметры запроса сохраняем: на витрине в них живёт
               * фильтр, и терять подборку при смене языка было бы поломкой, а не переводом.
               */
              window.location.href = `/${locale}${pathname}${window.location.search}`;
            }}
            className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
              active
                ? 'bg-cta text-base-darker cursor-default'
                : 'text-text-muted hover:text-text cursor-pointer'
            }`}
          >
            {locale}
          </button>
        );
      })}
    </div>
  );
}
