'use client';

import React from 'react';
import { ShoppingCart, Wrench } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { SHOP_BASE, SHOP_CATALOG } from '@/lib/shop/urls';
import { useCart } from './cart-context';

/**
 * Полоса раздела запчастей: вход в каталог и кнопка корзины.
 *
 * Своей шапки у магазина больше нет — сайт один, и вторая шапка под первой выглядела бы
 * склейкой двух сайтов. Но открыть корзину как-то надо: панель сама показывается только
 * сразу после «В корзину», и без этой кнопки к отложенным деталям было бы не вернуться.
 *
 * Кнопка живёт здесь, а не в общей шапке сайта, по двум причинам: корзина существует
 * только внутри раздела (провайдер поднят в его layout), а на страницах проверки VIN
 * счётчик товаров ничего не значит.
 *
 * Прилипает под шапкой (h-16), а не к нулю, иначе перекрыла бы её на прокрутке.
 */
export function ShopBar() {
  const { count, open } = useCart();

  return (
    <div className="sticky top-16 z-30 border-b border-border-subtle bg-base/80 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex h-12 items-center justify-between gap-4">
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

        <button
          type="button"
          onClick={open}
          className="inline-flex items-center gap-2 rounded-lg bg-elevated hover:bg-surface px-3 py-1.5 text-sm font-semibold text-text transition-colors cursor-pointer shrink-0"
        >
          <ShoppingCart className="h-4 w-4" />
          <span className="hidden sm:inline">Корзина</span>
          {/*
            Счётчик появляется только когда в корзине что-то есть: пустой ноль
            в углу экрана — это шум, а не информация.
          */}
          {count > 0 && (
            <span className="rounded-full bg-cta px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-base-darker">
              {count}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
