'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { getAuthClient } from '@/lib/auth/client';
import { VIN_PATHS } from '@/lib/seo';
import type { VinLookupPage } from '@/types/vin-lookup';

/**
 * История проверок по VIN в кабинете.
 *
 * Показывает журнал с сервера (`partsfit_vin_lookups`), а не список из localStorage:
 * тот принадлежит браузеру и на другом устройстве пуст, а человек ждёт увидеть здесь
 * всё, что проверял под своим аккаунтом.
 *
 * Пагинация серверная. Тянуть всё разом нельзя не из-за объёма сегодня, а из-за того,
 * что у активного покупателя журнал растёт неограниченно: лимит пять в сутки потолка
 * не ставит, он ставит скорость.
 */

type Locale = 'ru' | 'en';

export function VinHistory({ locale }: { locale: Locale }) {
  const t = TEXT[locale];
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<VinLookupPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  /*
   * Ответ, устаревший к моменту прихода, отбрасываем. Быстрые нажатия «дальше» дают
   * два запроса в полёте, и порядок ответов не гарантирован — без счётчика на экране
   * оказалась бы чужая страница под текущим номером. Тот же приём, что на странице
   * проверки по VIN, и заведён он там ровно после такого случая.
   */
  const seq = useRef(0);

  /*
   * Состояние меняется в колбэках промиса, а не в теле эффекта: синхронный setState
   * внутри эффекта запрещён правилами React, и линтер ловит это ошибкой — причём
   * трассирует и внутрь локальной функции, так что вынести запрос в `useCallback`
   * не помогает. Тот же приём уже стоит в `AccountClient`.
   *
   * Повтор после отказа — через `reloadKey`, а не вызовом загрузки из обработчика:
   * так у эффекта остаётся единственная точка входа.
   */
  useEffect(() => {
    const mine = ++seq.current;
    fetchPage(page).then(
      (result) => {
        if (mine !== seq.current) return;
        setData(result);
        setFailed(false);
        setLoading(false);
      },
      () => {
        if (mine !== seq.current) return;
        setFailed(true);
        setLoading(false);
      }
    );
  }, [page, reloadKey]);

  const goTo = (next: number) => {
    setLoading(true);
    setFailed(false);
    setPage(next);
  };

  const retry = () => {
    setLoading(true);
    setFailed(false);
    setReloadKey((n) => n + 1);
  };

  const checkHref = `/${locale}${VIN_PATHS[locale]}#decoder`;

  return (
    <section className="mt-6 rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold text-text">{t.title}</h2>
        {data && data.total > 0 && (
          <span className="shrink-0 text-sm text-text-dim">{t.total(data.total)}</span>
        )}
      </div>

      {loading && !data ? (
        <div className="h-40 animate-pulse rounded-lg bg-elevated" />
      ) : failed ? (
        <div className="space-y-3">
          <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{t.failed}</p>
          <button
            type="button"
            onClick={retry}
            className="text-sm font-medium text-primary hover:underline"
          >
            {t.retry}
          </button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-text-secondary">
          {t.empty}{' '}
          <a href={checkHref} className="font-medium text-primary hover:underline">
            {t.emptyLink}
          </a>
        </p>
      ) : (
        <>
          <ul className={`divide-y divide-border-subtle ${loading ? 'opacity-60' : ''}`}>
            {data.items.map((item) => (
              <li
                key={`${item.vin}-${item.lookedUpAt}`}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3"
              >
                <span className="font-mono text-sm font-medium tracking-wide text-text">
                  {item.vin}
                </span>
                <span className="flex items-center gap-3 text-xs text-text-dim">
                  <span className={REGISTRY_TONE[item.registry] ?? 'text-text-dim'}>
                    {t.registry[item.registry as keyof typeof t.registry] ?? t.registry.unknown}
                  </span>
                  <time dateTime={item.lookedUpAt}>
                    {new Date(item.lookedUpAt).toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </span>
              </li>
            ))}
          </ul>

          {data.pages > 1 && (
            <nav className="mt-4 flex items-center justify-between border-t border-border-subtle pt-4">
              <PageButton
                disabled={data.page <= 1 || loading}
                onClick={() => goTo(Math.max(1, data.page - 1))}
                label={t.prev}
                side="prev"
              />
              <span className="flex items-center gap-2 text-sm text-text-secondary">
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {t.pageOf(data.page, data.pages)}
              </span>
              <PageButton
                disabled={data.page >= data.pages || loading}
                onClick={() => goTo(Math.min(data.pages, data.page + 1))}
                label={t.next}
                side="next"
              />
            </nav>
          )}
        </>
      )}
    </section>
  );
}

/**
 * Запрос страницы журнала. Чистая: ничего не пишет в состояние, отказ бросает.
 * Отсюда и её место вне компонента — эффекту остаётся только разложить результат.
 */
async function fetchPage(page: number): Promise<VinLookupPage> {
  const { data } = await getAuthClient().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('нет сессии');

  const response = await fetch(`/api/vin/history?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(String(response.status));

  /*
   * Разбираем вручную: при 502 от прокси в теле лежит HTML, и `response.json()`
   * бросил бы разбором вместо внятного отказа.
   */
  return JSON.parse(await response.text()) as VinLookupPage;
}

function PageButton({
  disabled,
  onClick,
  label,
  side,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
  side: 'prev' | 'next';
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1 text-sm font-medium text-primary transition hover:underline disabled:cursor-default disabled:text-text-dim disabled:no-underline"
    >
      {side === 'prev' && <ChevronLeft className="h-4 w-4" />}
      {label}
      {side === 'next' && <ChevronRight className="h-4 w-4" />}
    </button>
  );
}

/** Цвет статуса: найденная запись — единственная, ради которой проверку и делают. */
const REGISTRY_TONE: Record<string, string> = {
  found: 'text-success',
  unavailable: 'text-cta',
};

const TEXT = {
  ru: {
    title: 'История проверок по VIN',
    total: (n: number) => `всего ${n}`,
    empty: 'Вы ещё не проверяли ни одного номера.',
    emptyLink: 'Проверить машину',
    failed: 'Не удалось загрузить историю.',
    retry: 'Попробовать ещё раз',
    prev: 'Назад',
    next: 'Дальше',
    pageOf: (page: number, pages: number) => `${page} из ${pages}`,
    registry: {
      found: 'запись найдена',
      'not-found': 'записи нет',
      unavailable: 'реестр не ответил',
      unknown: '—',
    },
  },
  en: {
    title: 'Your VIN checks',
    total: (n: number) => `${n} total`,
    empty: 'You have not checked any VIN yet.',
    emptyLink: 'Check a car',
    failed: 'Could not load your history.',
    retry: 'Try again',
    prev: 'Back',
    next: 'Next',
    pageOf: (page: number, pages: number) => `${page} of ${pages}`,
    registry: {
      found: 'record found',
      'not-found': 'no record',
      unavailable: 'registry did not answer',
      unknown: '—',
    },
  },
} as const;
