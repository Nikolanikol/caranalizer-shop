'use client';

import { ShoppingCart } from 'lucide-react';
import { usePathname } from '@/i18n/navigation';
import { SHOP_BASE } from '@/lib/shop/urls';
import { useCart } from './cart-context';

/**
 * Кнопка корзины в шапке сайта.
 *
 * Раньше жила в полосе раздела запчастей: провайдер корзины был поднят только в его
 * layout, а шапка лежит выше по дереву — контекст течёт вниз, и прочитать его она
 * не могла. Теперь провайдер стоит в `[lang]/layout.tsx`, поэтому кнопка переехала
 * туда, где её и ищут.
 *
 * Показываем не всегда: внутри раздела запчастей — постоянно, за его пределами —
 * только когда в корзине что-то есть. Пустая корзина на странице проверки по VIN
 * ничего не значит, а вот отложенные детали должны быть доступны с любой страницы,
 * иначе человек, ушедший читать гайд, к ним не вернётся.
 */
export function CartButton() {
  const { count, open } = useCart();
  const pathname = usePathname();

  const inShop = pathname === SHOP_BASE || pathname.startsWith(`${SHOP_BASE}/`);
  if (!inShop && count === 0) return null;

  return (
    <button
      type="button"
      onClick={open}
      aria-label={count > 0 ? `Корзина, товаров: ${count}` : 'Корзина'}
      className="relative inline-flex items-center gap-2 rounded-lg bg-elevated hover:bg-surface px-3 py-2 text-sm font-semibold text-text transition-colors cursor-pointer shrink-0"
    >
      <ShoppingCart className="h-4 w-4" />
      <span className="hidden sm:inline">Корзина</span>
      {/* Счётчик только когда есть что считать: ноль в углу экрана — шум, а не информация. */}
      {count > 0 && (
        <span className="rounded-full bg-cta px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-base-darker">
          {count}
        </span>
      )}
    </button>
  );
}
