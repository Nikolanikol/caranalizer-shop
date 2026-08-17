import React from 'react';
import { Link } from '@/i18n/navigation';
// CATEGORIES живёт в серверном слое каталога, пути — в urls: этот файл серверный,
// поэтому импорт безопасен, но брать адреса из urls дешевле.
import { CATEGORIES } from '@/lib/shop/catalog';
import { categoryUrl } from '@/lib/shop/urls';
import type { PartCategory } from '@/types/part';

/**
 * Общая геометрия страниц раздела запчастей.
 *
 * Правило, из которого этот файл и появился: **между страницами раздела допустимы только
 * вертикальные различия, горизонтальные — нет.** До этого витрина была центрированным
 * лендингом (`max-w-3xl text-center`, h1 на `sm:text-5xl`, поиск по центру, пилюли под
 * текстом), а страницы каталога — левым макетом в `max-w-7xl`. При переходе заголовок
 * улетал влево и уменьшался, пилюли перелетали через экран вправо, поиск смещался
 * в правую колонку и растягивался. Вертикальный сдвиг читается как навигация,
 * горизонтальный — как поломка.
 *
 * Поэтому шапка и рамка живут здесь, а не копиями в двух файлах: одинаковые строки
 * классов в разных местах разъезжаются на первой же правке.
 */

/**
 * Шапка страницы раздела: заголовок слева, пилюли категорий справа сверху.
 *
 * Отступы намеренно низкие. В прежнем виде шапка каталога съедала весь первый экран:
 * первый товар начинался на 598 пикселе при высоте окна 720, а на телефоне — сильно ниже.
 *
 * Размер h1 — `text-3xl sm:text-4xl`, на ступень выше подзаголовков раздела. При `text-2xl`
 * он читался слабее пилюль справа, и заголовок страницы выглядел отсутствующим.
 */
export function ShopHeader({
  heading,
  intro,
  activeCategory,
}: {
  heading: string;
  intro: string;
  /** Подсвеченная пилюля. На витрине категории нет — не подсвечена ни одна. */
  activeCategory?: PartCategory;
}) {
  return (
    <div className="relative bg-base border-b border-border-subtle py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <h1 className="text-3xl sm:text-4xl font-black text-text tracking-tight leading-tight">{heading}</h1>
          <p className="max-w-2xl text-xs sm:text-sm text-text-secondary leading-relaxed line-clamp-2">{intro}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {(Object.keys(CATEGORIES) as PartCategory[]).map((key) => (
            <Link
              key={key}
              href={categoryUrl(key)}
              className={`px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${
                activeCategory === key
                  ? 'bg-cta text-base-darker'
                  : 'bg-base-darker border border-border-subtle text-text-secondary hover:text-text'
              }`}
            >
              {CATEGORIES[key].plural}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Двухколоночная рамка: фильтр слева, содержимое справа.
 *
 * `lg:top-20` — 80 пикселей: шапка сайта занимает 64, плюс небольшой отступ. Раньше здесь
 * было `top-28` под шапку и прилипающую полосу раздела; полосы больше нет, и при старом
 * значении под шапкой оставалась пустая щель.
 */
export function ShopFrame({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    // Не <main>: он уже раскрыт в layout сайта — вложенный ломает разметку
    // и переход по ссылке «к содержимому».
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-20 lg:border-r border-border-subtle lg:pr-6 pb-6 lg:pb-8">
          {sidebar}
        </aside>
        <div className="flex-1 w-full min-w-0">{children}</div>
      </div>
    </div>
  );
}
