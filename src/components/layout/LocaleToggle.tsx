'use client';

import { Globe } from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { SITE_LOCALES, VIN_PATHS } from '@/lib/seo';

/**
 * Переключатель языка в шапке. Компактный, две кнопки: RU и EN.
 *
 * Сначала он появился только для раздела запчастей — тогда только раздел и был
 * двуязычным. С 28.08.2026 на английском открыт весь сайт, и ограничение снято:
 * переключатель стоит везде, кроме страницы проверки по VIN.
 *
 * Исключение у проверки не случайное. Она единственная существует ещё и на арабском,
 * путь у каждой локали свой (`VIN_PATHS`), и на ней стоит собственный крупный
 * переключатель на три языка. Второй, на два, рядом с ним читался бы как поломка.
 *
 * Из шапки переключатель когда-то убрали, и по делу: он предлагал языки для страниц,
 * которых на них не существует. Теперь существуют — английские тексты у страниц лежали
 * в коде всё это время, их прятал редирект `/en → проверка`.
 *
 * `hreflang` в разметке — сигнал для Google, а не навигация: живой человек по нему
 * переключиться не может. Без этой кнопки английская версия была бы только для робота.
 */
export function LocaleToggle() {
  const pathname = usePathname();
  const current = useLocale();

  // На арабском переключать нечего: кроме проверки и правовых страниц там ничего нет.
  if (!(SITE_LOCALES as readonly string[]).includes(current)) return null;
  // У страницы проверки свой переключатель, на три языка.
  if (Object.values(VIN_PATHS).includes(pathname as (typeof VIN_PATHS)[keyof typeof VIN_PATHS])) {
    return null;
  }

  return (
    <div
      role="group"
      aria-label={current === 'en' ? 'Language' : 'Язык'}
      className="flex items-center gap-1 rounded-lg bg-elevated border border-border-subtle px-1.5 py-1"
    >
      <Globe className="h-3.5 w-3.5 text-text-muted shrink-0" aria-hidden />
      {SITE_LOCALES.map((locale) => {
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
               * на странице проверки. Параметры запроса сохраняем: на витрине раздела
               * в них живёт фильтр, и терять подборку при смене языка было бы поломкой.
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
