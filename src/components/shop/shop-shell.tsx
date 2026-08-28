import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
// CATEGORIES живёт в серверном слое каталога, пути — в urls: этот файл серверный,
// поэтому импорт безопасен, но брать адреса из urls дешевле.
import { CATEGORIES } from '@/lib/shop/catalog';
import { categoryPlural } from '@/lib/shop/labels';
import type { ShopLocale } from '@/lib/shop/terms';
import { SHOP_BASE, WHEELS_BASE, categoryUrl } from '@/lib/shop/urls';
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
 * Шапка страницы раздела: заголовок сверху, полоса категорий под ним.
 *
 * Раньше пилюли стояли справа от заголовка. С двумя категориями это работало, с
 * одиннадцатью — нет: `shrink-0` отдавал им всю нужную ширину, и «Блоки управления
 * двигателем BMW 3 Series» разъезжался на шесть строк, а сами пилюли обрезались краем
 * экрана. Под заголовком они не отнимают у него ширину и переносятся на вторую строку.
 *
 * Геометрия одинакова на всех страницах раздела — правило, из которого этот файл
 * и появился, никуда не делось: заголовок и полоса стоят на одних координатах везде.
 *
 * Отступы намеренно низкие. В прежнем виде шапка каталога съедала весь первый экран:
 * первый товар начинался на 598 пикселе при высоте окна 720, а на телефоне — сильно ниже.
 */
export function ShopHeader({
  heading,
  intro,
  activeCategory,
  activeWheels = false,
  trail,
  locale = 'ru',
}: {
  heading: string;
  intro: string;
  /** Язык страницы: на нём подписываются пилюли типов деталей и служебные ярлыки. */
  locale?: ShopLocale;
  /** Подсвеченная пилюля. На витрине категории нет — не подсвечена ни одна. */
  activeCategory?: PartCategory;
  /**
   * Диски — второй донор, и в реестре типов деталей их нет: у них ни партномера,
   * ни стороны, ни иерархии марка/модель. Поэтому пилюля отдельным флагом,
   * а не двенадцатым ключом `CATEGORIES` — иначе они попали бы в карту сайта,
   * в пререндер маршрутов запчастей и в фильтр каталога, которому не принадлежат.
   */
  activeWheels?: boolean;
  /**
   * Путь до страницы. Последняя ступень — сама страница, у неё адреса нет.
   *
   * Живёт в шапке, а не в каждой странице: без крошек со страницы модели нельзя было
   * подняться к марке — полоса категорий уводит на верхний уровень, а промежуточные
   * ступени в разметке просто отсутствовали.
   */
  trail?: { name: string; href?: string }[];
}) {
  return (
    <div className="relative bg-base border-b border-border-subtle py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="relative max-w-7xl mx-auto space-y-4">
        {trail && trail.length > 0 && (
          <nav
            aria-label={locale === 'en' ? 'Breadcrumbs' : 'Хлебные крошки'}
            className="flex items-center flex-wrap gap-1 text-[10px] font-bold uppercase tracking-widest text-text-muted"
          >
            {trail.map((step, index) => (
              <React.Fragment key={`${step.href ?? 'current'}-${step.name}`}>
                {index > 0 && <ChevronRight className="w-3 h-3" />}
                {step.href ? (
                  <Link href={step.href} className="hover:text-text transition-colors">
                    {step.name}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-text-secondary">
                    {step.name}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-text tracking-tight leading-tight text-balance">
            {heading}
          </h1>
          <p className="max-w-3xl text-xs sm:text-sm text-text-secondary leading-relaxed line-clamp-2">{intro}</p>
        </div>

        {/* Пилюли переносятся, а не прокручиваются: в прокрутке правый край обрезался,
            и было не видно, что список продолжается. Все одиннадцать типов деталей
            должны читаться сразу — это единственная навигация по разделу. */}
        <nav
          aria-label={locale === 'en' ? 'Part types' : 'Типы деталей'}
          className="flex flex-wrap items-center gap-1.5 sm:gap-2"
        >
          <Link
            href={SHOP_BASE}
            className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded text-[10px] font-bold uppercase tracking-wide sm:tracking-widest transition-colors ${
              activeCategory || activeWheels
                ? 'bg-base-darker border border-border-subtle text-text-secondary hover:text-text'
                : 'bg-cta text-base-darker'
            }`}
          >
            {locale === 'en' ? 'All parts' : 'Все запчасти'}
          </Link>
          {(Object.keys(CATEGORIES) as PartCategory[]).map((key) => (
            <Link
              key={key}
              href={categoryUrl(key)}
              className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded text-[10px] font-bold uppercase tracking-wide sm:tracking-widest transition-colors ${
                activeCategory === key
                  ? 'bg-cta text-base-darker'
                  : 'bg-base-darker border border-border-subtle text-text-secondary hover:text-text'
              }`}
            >
              {categoryPlural(key, locale, CATEGORIES[key].plural)}
            </Link>
          ))}
          {/* Диски стоят последними и с тем же оформлением: для покупателя это такой же
              раздел товара, и выделять его нечем — разница в источнике, а не в товаре. */}
          <Link
            href={WHEELS_BASE}
            className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded text-[10px] font-bold uppercase tracking-wide sm:tracking-widest transition-colors ${
              activeWheels
                ? 'bg-cta text-base-darker'
                : 'bg-base-darker border border-border-subtle text-text-secondary hover:text-text'
            }`}
          >
            {locale === 'en' ? 'Wheels' : 'Диски'}
          </Link>
        </nav>
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
