'use client';

import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import type { ShopLocale } from '@/lib/shop/terms';
import { ui } from '@/lib/shop/ui-text';

/**
 * Галерея карточки товара. Фото — главное, что есть у б/у детали:
 * покупатель принимает решение по ним, поэтому лента полная, без обрезки.
 */
export function Gallery({
  images,
  alt,
  locale = 'ru',
}: {
  images: string[];
  alt: string;
  locale?: ShopLocale;
}) {
  const t = ui(locale);
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  if (images.length === 0) {
    return (
      <div className="w-full aspect-[4/3] bg-base-darker border border-border-subtle rounded flex flex-col items-center justify-center text-text-dim">
        <ImageOff className="w-10 h-10 mb-2 opacity-40" />
        <span className="text-[10px] font-bold uppercase tracking-widest">{t.noPhoto}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative w-full aspect-[4/3] bg-base-darker rounded overflow-hidden border border-border-subtle">
        {failed[active] ? (
          <div className="w-full h-full flex items-center justify-center text-text-dim">
            <ImageOff className="w-10 h-10 opacity-40" />
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={images[active]}
            alt={alt}
            referrerPolicy="no-referrer"
            onError={() => setFailed((prev) => ({ ...prev, [active]: true }))}
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`${t.photo} ${index + 1} ${t.photoOf} ${images.length}`}
              className={`w-16 h-16 rounded overflow-hidden border shrink-0 transition-all cursor-pointer ${
                active === index ? 'border-cta opacity-100' : 'border-border-subtle opacity-50 hover:opacity-100'
              }`}
            >
              {/* Миниатюры дублируют основное фото — alt пустой намеренно */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
