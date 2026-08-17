'use client';

import React from 'react';
import { Wrench } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { SHOP_BASE, SHOP_CATALOG } from '@/lib/shop/urls';

/**
 * Полоса раздела запчастей: вход на витрину и в каталог.
 *
 * Своей шапки у магазина нет — сайт один, и вторая шапка под первой выглядела бы
 * склейкой двух сайтов. Кнопка корзины отсюда уехала в шапку сайта: провайдер поднят
 * в `[lang]/layout.tsx`, и корзина доступна с любой страницы, а не только из раздела.
 *
 * Прилипает под шапкой (h-16), а не к нулю, иначе перекрыла бы её на прокрутке.
 */
export function ShopBar() {
  return (
    <div className="sticky top-16 z-30 border-b border-border-subtle bg-base/80 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex h-12 items-center gap-4">
        <div className="flex items-center gap-1 min-w-0">
          <Link
            href={SHOP_BASE}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-semibold text-text hover:bg-elevated transition-colors shrink-0"
          >
            <Wrench className="h-4 w-4 text-cta" />
            Запчасти
          </Link>
          <Link
            href={SHOP_CATALOG}
            className="px-3 py-1.5 rounded-md text-sm font-medium text-text-secondary hover:text-text hover:bg-elevated transition-colors truncate"
          >
            Каталог
          </Link>
        </div>
      </div>
    </div>
  );
}
