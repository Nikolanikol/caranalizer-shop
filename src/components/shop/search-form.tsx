'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
// Роутер из next-intl, а не из next/navigation: иначе переход уедет на /zapchasti
// без языка и доедет до места только лишним редиректом.
import { useRouter } from '@/i18n/navigation';
import { SHOP_CATALOG } from '@/lib/shop/urls';

/**
 * Поиск по каталогу — стоит рядом с товарами, а не в шапке сайта.
 *
 * Всегда ведёт в полный каталог: результаты нужно где-то показать, а на витрине
 * раздела и на странице товара места под выдачу нет.
 */
export function SearchForm({
  size = 'normal',
  initialTerm = '',
}: {
  size?: 'normal' | 'large';
  initialTerm?: string;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(initialTerm);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const query = term.trim();
    router.push(query ? `${SHOP_CATALOG}?search=${encodeURIComponent(query)}` : SHOP_CATALOG);
  };

  return (
    <form onSubmit={submit} role="search" className={size === 'large' ? 'max-w-xl mx-auto' : ''}>
      <div
        className={`relative flex items-center bg-base-darker rounded-lg border border-border-subtle focus-within:border-cta transition-colors ${
          size === 'large' ? 'px-5 py-4' : 'px-4 py-3'
        }`}
      >
        <Search className="w-4 h-4 text-text-muted shrink-0 mr-3" />
        <input
          type="search"
          name="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          aria-label="Поиск по каталогу"
          placeholder="Артикул, марка или модель — например, Соната"
          className="bg-transparent border-none text-text w-full text-sm outline-none placeholder:text-text-dim"
        />
        {size === 'large' && (
          <button
            type="submit"
            className="ml-3 shrink-0 px-4 py-2 rounded bg-cta hover:bg-cta-hover text-base-darker text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
          >
            Найти
          </button>
        )}
      </div>
    </form>
  );
}
