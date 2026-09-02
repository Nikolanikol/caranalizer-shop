import React from 'react';

/**
 * Скелет сетки карточек — один на две площадки показа.
 *
 * Он нужен и в `zapchasti/loading.tsx` (переход между маршрутами), и в `catalog-view.tsx`
 * (смена фильтра на том же маршруте, где `loading.tsx` не срабатывает вовсе). Две копии
 * одной сетки разъехались бы на первой же правке отступов.
 *
 * **Высота повторяет `ProductCard` до пикселя, и числа тут замерены, а не подобраны
 * на глаз** (браузер, три колонки):
 *
 * ```
 * ProductCard 631 = фото 256 + тело 373 + рамка 2
 * тело 373 = padding 48 + заголовок 64 + mb 16 + коробка 42 + mb 24 + низ 179
 * низ  179 = цена 31 + mb 8 + строка о доставке 48 + mb 24 + кнопка 68
 *
 * WheelCard   647 — всё то же, кроме коробки: у диска она 58 (две строки)
 * ```
 *
 * Отсюда и единственный параметр `infoBoxHeight`: карточки двух доноров различаются
 * только этим. Заводить второй компонент под диски незачем — раздел для покупателя один,
 * и вести себя обе выдачи обязаны одинаково.
 *
 * Зачем такая дотошность: скелет подменяет выдачу **на той же странице**, и всё, что ниже
 * сетки, стоит на её высоте. Первая версия была вдвое ниже настоящей, страница на время
 * загрузки складывалась с 15 624 до 11 356 пикселей, браузер подтягивал прокрутку — и приезд
 * товаров читался рывком, то есть ровно тем, от чего скелет и заводили. Правите `ProductCard`
 * — перемерьте и поправьте здесь, иначе рывок вернётся молча.
 *
 * Две строки у подписи о доставке и 68 пикселей у кнопки — не описка: «Доставка
 * оплачивается отдельно» переносится, а у кнопки к `py-3.5` добавляется строка с иконкой.
 */
export function CardGridSkeleton({
  count = 6,
  infoBoxHeight = 42,
}: {
  count?: number;
  /**
   * Высота коробки характеристик. У детали там одна строка с OEM-номером (42 пикселя),
   * у диска — две (58). Это единственное, чем карточки двух доноров различаются
   * по высоте: фото `h-64`, тело `p-6`, заголовок и низ у них совпадают.
   */
  infoBoxHeight?: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-elevated border border-border-subtle rounded-xl overflow-hidden flex flex-col"
        >
          <div className="w-full h-64 bg-base-darker" />

          <div className="p-6 flex-1 flex flex-col">
            {/* Заголовок (две строки) и подпись под ним — 64 пикселя вместе */}
            <div className="mb-4">
              <div className="h-[44px] flex flex-col justify-center gap-1.5">
                <div className="h-4 w-11/12 rounded bg-surface/70" />
                <div className="h-4 w-2/3 rounded bg-surface/70" />
              </div>
              <div className="h-4 w-1/2 rounded bg-surface/40 mt-1" />
            </div>

            {/* Коробка характеристик: у детали строка с OEM, у диска две строки */}
            <div
              style={{ height: infoBoxHeight }}
              className="bg-base-darker border border-border-subtle rounded-lg mb-6"
            />

            <div className="mt-auto">
              <div className="h-[31px] w-32 rounded bg-surface/70 mb-2" />
              <div className="h-[48px] mb-6 flex flex-col justify-center gap-1.5">
                <div className="h-3.5 w-full rounded bg-surface/40" />
                <div className="h-3.5 w-1/2 rounded bg-surface/40" />
              </div>
              <div className="h-[68px] rounded-lg bg-base-darker" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
