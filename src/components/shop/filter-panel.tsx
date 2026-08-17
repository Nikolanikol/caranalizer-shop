'use client';

import React, { useState } from 'react';
import { ChevronDown, Filter } from 'lucide-react';

/**
 * Обёртка фильтров для мобильного.
 *
 * До этого блок фильтров занимал 817 пикселей и лежал между шапкой и товарами: на телефоне
 * первый товар начинался на 1601-м пикселе при экране в 898, то есть человек пролистывал
 * весь список из 30 марок, прежде чем увидеть хоть одну деталь. Теперь на узком экране это
 * кнопка, а с lg фильтры всегда развёрнуты и кнопка не показывается.
 *
 * Содержимое приходит children и остаётся серверным — клиентское здесь только состояние.
 */
export function FilterPanel({ activeCount, children }: { activeCount: number; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="lg:hidden w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-base-darker border border-border-subtle text-sm font-bold text-text cursor-pointer"
      >
        <span className="flex items-center gap-2.5">
          <Filter className="w-4 h-4 text-text-secondary" />
          Фильтры каталога
          {activeCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-cta text-base-darker text-[10px] tabular-nums">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <div className={`${isOpen ? 'block' : 'hidden'} lg:block mt-4 lg:mt-0`}>{children}</div>
    </div>
  );
}
