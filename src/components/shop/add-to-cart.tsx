'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import type { AutoPart, Offer } from '@/types/part';
import { trackAddToCart } from '@/lib/analytics';
import { useCart } from './cart-context';

/**
 * Кнопка «в корзину». Кладёт **экземпляр**, а не деталь.
 *
 * Это не мелочь: у одной детали до шестидесяти четырёх экземпляров, и цена между ними
 * отличается вдвое. Положи мы в корзину деталь — покупатель выбрал бы фару за 385 тысяч
 * вон, а счёт пришёл бы по минимальной цене страницы. Поэтому в корзину уезжает снимок
 * выбранного экземпляра: его цена, его фотографии и его `id` — `product_no` донора,
 * уникальный по всему каталогу.
 *
 * Без выбранного экземпляра (в списках товаров) берём самый дешёвый — тот же, что уже
 * показан ценой на карточке.
 */
export function AddToCart({
  part,
  offer,
  size = 'normal',
  label = 'В корзину',
}: {
  part: AutoPart;
  offer?: Offer;
  size?: 'normal' | 'large';
  /** Подпись приходит сверху: компонент клиентский, а язык известен странице. */
  label?: string;
}) {
  const { add } = useCart();

  const chosen: AutoPart = offer
    ? {
        ...part,
        id: offer.id,
        offers: undefined,
        priceKrw: offer.priceKrw,
        priceKrwMax: offer.priceKrw,
        images: offer.images,
        conditionGrade: offer.conditionGrade,
        conditionNotes: offer.conditionNotes,
        year: offer.year,
        used: offer.used,
        aftermarket: offer.aftermarket,
      }
    : part;

  return (
    <button
      type="button"
      onClick={() => {
        add(chosen);
        // `chosen.id` — ключ корзины: у выбранного экземпляра это `product_no` донора.
        trackAddToCart({ id: chosen.id, oem: chosen.oemNumber, category: chosen.category });
      }}
      className={`w-full flex items-center justify-center gap-2 bg-cta hover:bg-cta-hover text-base-darker font-bold rounded-lg transition-colors cursor-pointer ${
        size === 'large' ? 'py-4 text-base' : 'py-3.5 text-sm'
      }`}
    >
      <ShoppingCart className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
