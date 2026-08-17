'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import type { AutoPart } from '@/types/part';
import { useCart } from './cart-context';

/** Единственная интерактивная часть карточки товара — остальное рендерит сервер. */
export function AddToCart({ part, size = 'normal' }: { part: AutoPart; size?: 'normal' | 'large' }) {
  const { add } = useCart();

  return (
    <button
      type="button"
      onClick={() => add(part)}
      className={`w-full flex items-center justify-center gap-2 bg-cta hover:bg-cta-hover text-base-darker font-bold rounded-lg transition-colors cursor-pointer ${
        size === 'large' ? 'py-4 text-base' : 'py-3.5 text-sm'
      }`}
    >
      <ShoppingCart className="w-4 h-4" />
      <span>В корзину</span>
    </button>
  );
}
