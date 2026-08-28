import React from 'react';
import { Link } from '@/i18n/navigation';
import { ImageOff } from 'lucide-react';
import type { AutoPart } from '@/types/part';
import { partUrl } from '@/lib/shop/catalog';
import { formatPartPrice } from '@/lib/shop/pricing';
import { getRates } from '@/lib/shop/rates';
import { CONDITION_CLASS, conditionLabel, partDescriptor, partHeading, partTitle } from '@/lib/shop/labels';
import type { ShopLocale } from '@/lib/shop/terms';
import { ui } from '@/lib/shop/ui-text';
import { AddToCart } from './add-to-cart';
import { CopyOem } from './copy-oem';

/**
 * Карточка товара. Серверный компонент: в браузер уходит только кнопка корзины.
 *
 * Два решения, которые не надо откатывать:
 *
 * 1. На фотографии — состояние детали, а не бейдж «Оригинал». Оригиналом являются 963 позиции
 *    из 967, то есть признак всегда истинный и ничего не сообщает, зато занимал самое заметное
 *    место. Состояние же у трети товаров — B или C, и покупатель обязан увидеть это до цены,
 *    а не после получения. Плашка «Аналог» осталась: она стоит на четырёх товарах и как раз
 *    несёт информацию.
 * 2. Заголовок начинается с машины, а не с типа детали. При обрезке в две строки из
 *    «Фонарь задний правый внутренний BMW 5 Series» пропадало ровно то, что ищут глазами.
 *
 * Бейдж «В наличии» убран: `stock` равен единице у всех 967 позиций, и зелёная точка
 * горела всегда.
 *
 * Курсы карточка берёт сама, а не получает пропсом сверху: `getRates` читает кэш,
 * и два десятка карточек на странице стоят одного запроса на всю сборку. Пропс
 * пришлось бы тянуть через витрину, категорию, марку, модель и страницу товара разом.
 *
 * Язык, в отличие от курсов, приходит пропсом: он известен странице из сегмента пути,
 * а читать его здесь значило бы дёргать `headers()` — и весь раздел стал бы динамическим.
 */
export async function ProductCard({ part, locale = 'ru' }: { part: AutoPart; locale?: ShopLocale }) {
  const image = part.images[0];
  const condition = conditionLabel(part, locale);
  const rates = await getRates();
  const t = ui(locale);

  return (
    <article className="group relative bg-elevated border border-border-subtle hover:border-cta rounded-xl overflow-hidden transition-colors duration-300 flex flex-col">
      <Link href={partUrl(part)} className="block relative w-full h-64 bg-base-darker overflow-hidden">
        {image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={image}
            alt={partTitle(part, locale)}
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
            CONDITION_CLASS[condition.tone]
          }`}
        >
          {condition.short}
        </span>

        {part.aftermarket && (
          <span className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-amber-950/90 text-amber-300 text-[10px] font-bold uppercase tracking-widest border border-amber-900">
            {t.aftermarket}
          </span>
        )}

        {part.images.length > 1 && (
          <span className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/70 backdrop-blur-md text-text text-[10px] font-bold rounded-full border border-border">
            {part.images.length} {t.photos}
          </span>
        )}
      </Link>

      <div className="p-6 flex-1 flex flex-col">
        <Link href={partUrl(part)} className="block mb-4">
          <h3 className="text-base font-bold text-text tracking-tight line-clamp-2 leading-snug group-hover:text-cta transition-colors">
            {partHeading(part)}
          </h3>
          <p className="text-xs text-text-muted mt-1 line-clamp-1">{partDescriptor(part, locale)}</p>
        </Link>

        <div className="flex items-center justify-between bg-base-darker border border-border-subtle rounded-lg p-3 mb-6">
          <span className="flex items-center gap-2 text-xs text-text-secondary font-mono min-w-0">
            <span className="truncate">
              OEM: <span className="text-text font-bold">{part.oemNumber || t.onRequest}</span>
            </span>
            <CopyOem value={part.oemNumber} />
          </span>
        </div>

        <div className="mt-auto">
          <div className="mb-2">
            <span className="text-[28px] font-bold text-text tracking-tight leading-none">
              {formatPartPrice(part.priceKrw, rates)}
            </span>
          </div>
          <div className="text-xs text-text-muted mb-6 font-medium">{t.shippingExtra}</div>

          <AddToCart part={part} label={t.addToCart} />
        </div>
      </div>
    </article>
  );
}

