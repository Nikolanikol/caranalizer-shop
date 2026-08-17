import React from 'react';

/**
 * Состояние загрузки для всего раздела запчастей.
 *
 * До этого его не было ни здесь, ни через Suspense, и переход между страницами
 * выглядел поломкой: App Router держит на экране прежнюю страницу, пока не придёт
 * новая, то есть 300–900 мс человек смотрит на витрину, уже нажав «Задние фонари»,
 * а потом всё содержимое подменяется разом. Отсюда ощущение, что интерфейс скачет.
 *
 * Скелет повторяет раскладку каталога — низкую шапку, боковой фильтр и сетку
 * карточек с тем же `h-64` под фотографию, — поэтому подстановка настоящего
 * содержимого не сдвигает страницу, а заполняет уже занятые места.
 *
 * Один файл на раздел: он лежит выше всех его маршрутов, значит закрывает и витрину,
 * и каталог, и категории, и посадочные марок с моделями, и карточку товара.
 */
export default function ShopLoading() {
  return (
    <div className="flex-1 w-full animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Загружаем каталог…</span>

      {/* Шапка: те же отступы, что у настоящей — py-6 sm:py-8 */}
      <div className="bg-base border-b border-border-subtle py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="space-y-2 min-w-0 w-full">
            <div className="h-8 sm:h-10 w-64 max-w-full rounded bg-elevated" />
            <div className="h-4 w-full max-w-2xl rounded bg-elevated/60" />
          </div>
          <div className="flex gap-2 shrink-0">
            <div className="h-9 w-32 rounded bg-elevated" />
            <div className="h-9 w-40 rounded bg-elevated" />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Фильтр. На узком экране он свёрнут в кнопку, поэтому и скелет там один блок. */}
          <aside className="w-full lg:w-72 shrink-0 lg:border-r border-border-subtle lg:pr-6">
            <div className="h-12 lg:hidden rounded-lg bg-elevated" />
            <div className="hidden lg:block space-y-6">
              <div className="h-5 w-40 rounded bg-elevated" />
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-9 rounded-lg bg-elevated/60" />
                ))}
              </div>
              <div className="h-5 w-36 rounded bg-elevated" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-9 rounded-lg bg-elevated/60" />
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1 w-full space-y-6">
            <div className="h-12 rounded-lg bg-elevated" />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border-subtle overflow-hidden">
                  {/* h-64 — ровно столько занимает фотография в ProductCard */}
                  <div className="h-64 bg-base-darker" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-elevated" />
                    <div className="h-3 w-1/2 rounded bg-elevated/60" />
                    <div className="h-5 w-1/3 rounded bg-elevated" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
