import React from 'react';
import type { ShopLocale } from '@/lib/shop/terms';
import { CardGridSkeleton } from './skeletons';

/**
 * Общий слой показа выдачи — один на обоих доноров.
 *
 * Доноров у раздела двое и таблицы у них разные: у детали из partsfit всё держится
 * на партномере, у диска со skywheel партномера нет вовсе. **Но для покупателя это один
 * раздел, и вести себя обе страницы обязаны одинаково** — поэтому панель над выдачей,
 * скелет и подпись для скринридера живут здесь, а не копией в каждой странице.
 * Разъехавшиеся копии дали бы разное поведение у страниц, которые выглядят одинаково.
 *
 * Что отличается — приезжает пропсом: ссылки сортировки у доноров свои (у запчастей
 * четыре варианта, у дисков три) и высота коробки характеристик в карточке.
 */

/** Панель над выдачей: слева счётчик, справа сортировка. */
export function ResultsToolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-border-subtle">
      {children}
    </div>
  );
}

/**
 * Скелет выдачи — то, что стоит на месте товаров, пока идёт запрос.
 *
 * Нужен затем, что `loading.tsx` **не срабатывает, когда меняются только параметры
 * запроса** (замерено на Next 16.2.9), а фильтр на обеих страницах живёт именно
 * параметрами. Подробности — в `link-pending.tsx` и в `AGENTS.md`.
 *
 * Ряд сортировки здесь настоящий, а не заглушка: он не зависит от данных, известен
 * из адреса и обязан стоять на том же месте, что и в готовой выдаче, — иначе приход
 * товаров дёргал бы его по вертикали.
 */
export function ResultsSkeleton({
  sort,
  count,
  locale,
  infoBoxHeight,
}: {
  /** Готовый ряд ссылок сортировки — тот же, что в настоящей выдаче. */
  sort: React.ReactNode;
  /** Столько же карточек, сколько на полной странице выдачи. */
  count: number;
  locale: ShopLocale;
  /** Высота коробки характеристик в карточке: 42 у детали, 58 у диска. */
  infoBoxHeight?: number;
}) {
  return (
    <div aria-busy="true">
      <span className="sr-only" role="status">
        {locale === 'en' ? 'Loading items…' : 'Загружаем товары…'}
      </span>

      <ResultsToolbar>
        {/* Высота как у строки «НАЙДЕНО: N», чтобы панель не прыгала */}
        <span className="h-4 w-40 rounded bg-elevated animate-pulse" />
        {sort}
      </ResultsToolbar>

      <div className="animate-pulse">
        <CardGridSkeleton count={count} infoBoxHeight={infoBoxHeight} />
      </div>
    </div>
  );
}
