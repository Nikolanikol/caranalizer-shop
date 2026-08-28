import React from 'react';
import { ImageOff } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { formatPartPrice } from '@/lib/shop/pricing';
import { getRates } from '@/lib/shop/rates';
import type { ShopLocale } from '@/lib/shop/terms';
import { ui } from '@/lib/shop/ui-text';
import { wheelUrl } from '@/lib/shop/urls';
import { wheelToCartPart } from '@/lib/shop/wheel-cart';
import { wheelTitle } from '@/lib/shop/wheels-text';
import type { Wheel } from '@/types/wheel';
import { AddToCart } from './add-to-cart';

/**
 * Карточка диска. Серверная, как и карточка детали: в браузер уходит только кнопка корзины.
 *
 * Отличий от `ProductCard` два, и оба следуют из данных, а не из вкусов.
 *
 * Вместо OEM-номера показан диаметр: партномера у диска нет вовсе, а строка «OEM: —»
 * на каждой карточке была бы честной, но пустой — место занимает, ничего не говорит.
 * Диаметр же есть у всех ста двадцати и это первое, чем диск отбирают.
 *
 * Состояние подписано словами продавца, а не грейдом: у донора это три значения
 * («хорошее», «среднее», «требует ремонта»), и шкалы A/B/C, как у запчастей, здесь нет.
 */

const GRADE_TONE: Record<string, string> = {
  good: 'bg-emerald-950/90 text-emerald-300 border border-emerald-900',
  fair: 'bg-amber-950/90 text-amber-300 border border-amber-900',
  repair: 'bg-red-950/90 text-red-300 border border-red-900',
  '': 'bg-base-darker/90 text-text-muted border border-border-subtle',
};

const GRADE_LABEL: Record<string, Record<ShopLocale, string>> = {
  good: { ru: 'Хорошее', en: 'Good' },
  fair: { ru: 'Среднее', en: 'Fair' },
  repair: { ru: 'Под ремонт', en: 'Needs repair' },
  // Донор промолчал — предупреждаем, а не успокаиваем.
  '': { ru: 'Не указано', en: 'Not stated' },
};

export async function WheelCard({ wheel, locale = 'ru' }: { wheel: Wheel; locale?: ShopLocale }) {
  const image = wheel.images[0]?.url;
  const rates = await getRates();
  const t = ui(locale);
  const href = wheelUrl(wheel.slug);
  const title = wheelTitle(wheel, locale);

  return (
    <article className="group relative bg-elevated border border-border-subtle hover:border-cta rounded-xl overflow-hidden transition-colors duration-300 flex flex-col">
      <Link href={href} className="block relative w-full h-64 bg-base-darker overflow-hidden">
        {image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={image}
            alt={title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="w-full h-full flex flex-col items-center justify-center text-text-dim">
            <ImageOff className="w-8 h-8 mb-2 opacity-40" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{t.noPhoto}</span>
          </span>
        )}

        <span
          className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-lg ${
            GRADE_TONE[wheel.grade]
          }`}
        >
          {GRADE_LABEL[wheel.grade][locale]}
        </span>

        {wheel.condition === 'new' && (
          <span className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-cta/90 text-base-darker text-[10px] font-bold uppercase tracking-widest">
            {locale === 'en' ? 'New' : 'Новый'}
          </span>
        )}

        {wheel.images.length > 1 && (
          <span className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/70 backdrop-blur-md text-text text-[10px] font-bold rounded-full border border-border">
            {wheel.images.length} {t.photos}
          </span>
        )}
      </Link>

      <div className="p-6 flex-1 flex flex-col">
        <Link href={href} className="block mb-4">
          <h3 className="text-base font-bold text-text tracking-tight line-clamp-2 leading-snug group-hover:text-cta transition-colors">
            {[wheel.brandName, wheel.model].filter(Boolean).join(' ')}
          </h3>
          <p className="text-xs text-text-muted mt-1 line-clamp-1">{title}</p>
        </Link>

        <div className="flex items-center justify-between gap-2 bg-base-darker border border-border-subtle rounded-lg p-3 mb-6 text-xs">
          <span className="text-text-secondary font-mono">
            {locale === 'en' ? 'Diameter' : 'Диаметр'}:{' '}
            <span className="text-text font-bold">
              {locale === 'en' ? `${wheel.diameter}″` : `R${wheel.diameter}`}
            </span>
          </span>
          {wheel.withTyres && (
            <span className="text-text-muted uppercase tracking-widest text-[10px] font-bold">
              {locale === 'en' ? 'with tyres' : 'с шинами'}
            </span>
          )}
        </div>

        <div className="mt-auto">
          {/*
            Цены продажи может не быть: донор у части объявлений публикует только цену
            со сдачей своих дисков в зачёт либо прайс по диаметрам, в котором нашего нет.
            Тогда пишем «по запросу» и не даём положить в корзину — сумму заявки сервер
            считает по цене, и товар без неё уехал бы менеджеру счётом на ноль.
          */}
          {wheel.priceKrw === null ? (
            <>
              <div className="mb-2">
                <span className="text-lg font-bold text-text tracking-tight leading-none">
                  {locale === 'en' ? 'Price on request' : 'Цена по запросу'}
                </span>
              </div>
              <div className="text-xs text-text-muted mb-6 font-medium">
                {locale === 'en' ? 'The seller has not named one' : 'Продавец не назвал её в объявлении'}
              </div>
              <Link
                href={href}
                className="w-full flex items-center justify-center gap-2 py-3.5 text-sm rounded-lg bg-base-darker border border-border-subtle text-text-secondary hover:text-text font-bold transition-colors"
              >
                {locale === 'en' ? 'Request price' : 'Запросить цену'}
              </Link>
            </>
          ) : (
            <>
              <div className="mb-2">
                <span className="text-[28px] font-bold text-text tracking-tight leading-none">
                  {formatPartPrice(wheel.priceKrw, rates)}
                </span>
              </div>
              <div className="text-xs text-text-muted mb-6 font-medium">{t.shippingExtra}</div>

              <AddToCart part={wheelToCartPart(wheel)} label={t.addToCart} />
            </>
          )}
        </div>
      </div>
    </article>
  );
}
