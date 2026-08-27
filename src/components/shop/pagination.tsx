import React from 'react';
import { Link } from '@/i18n/navigation';
import type { ShopLocale } from '@/lib/shop/terms';
import { ui } from '@/lib/shop/ui-text';
import { catalogUrl } from '@/lib/shop/urls';

/** Пагинация ссылками: страницы каталога должны быть обходимы поисковиком. */
export function Pagination({
  page,
  totalPages,
  base,
  query,
  locale = 'ru',
}: {
  page: number;
  totalPages: number;
  locale?: ShopLocale;
  /** Путь подборки без параметров: '/zapchasti', '/zapchasti/zadnie-fonari/bmw/5-series'. */
  base: string;
  query: Omit<Parameters<typeof catalogUrl>[0], 'base' | 'page'>;
}) {
  const t = ui(locale);
  if (totalPages <= 1) return null;

  const pages: (number | 'gap')[] = [];
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== 'gap') {
      pages.push('gap');
    }
  }

  const linkClass =
    'w-10 h-10 flex items-center justify-center rounded text-[10px] font-black tracking-widest transition-colors bg-elevated border border-border-subtle hover:bg-surface text-text-secondary hover:text-text';

  return (
    <nav aria-label={t.pages} className="flex justify-center items-center gap-3 pt-8 border-t border-border-subtle">
      {page > 1 && (
        <Link href={catalogUrl({ base, ...query, page: page - 1 })} rel="prev" className={`${linkClass} px-4 w-auto`}>{t.prev}</Link>
      )}

      {pages.map((entry, index) =>
        entry === 'gap' ? (
          <span key={`gap-${index}`} className="text-text-dim px-2 font-black tracking-widest">
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={catalogUrl({ base, ...query, page: entry })}
            aria-current={entry === page ? 'page' : undefined}
            className={
              entry === page
                ? 'w-10 h-10 flex items-center justify-center rounded text-[10px] font-black tracking-widest bg-cta text-base-darker'
                : linkClass
            }
          >
            {entry}
          </Link>
        ),
      )}

      {page < totalPages && (
        <Link href={catalogUrl({ base, ...query, page: page + 1 })} rel="next" className={`${linkClass} px-4 w-auto`}>{t.next}</Link>
      )}
    </nav>
  );
}
