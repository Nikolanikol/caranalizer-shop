'use client';

import React, { useEffect, useState } from 'react';
import { Check, Fingerprint, Truck } from 'lucide-react';
import type { AutoPart, Offer } from '@/types/part';
import type { Rates } from '@/lib/shop/pricing';
import { formatPartPrice } from '@/lib/shop/pricing';
import { CONDITION_CLASS, conditionLabel, partTitle } from '@/lib/shop/labels';
import {
  COMPLETENESS_EN,
  CONDITION_NOTES_EN,
  FEATURES_EN,
  LAMP_TYPE_EN,
  type ShopLocale,
  term,
  terms,
} from '@/lib/shop/terms';
import { ui } from '@/lib/shop/ui-text';
import { trackViewItem } from '@/lib/analytics';
import { Gallery } from './gallery';
import { AddToCart } from './add-to-cart';
import { CopyOem } from './copy-oem';

/**
 * Выбор экземпляра на странице детали.
 *
 * Донор торгует разбором: у левой фары Genesis G80 шестьдесят четыре экземпляра
 * с разных машин, и цена между ними отличается вдвое — от 198 до 385 тысяч вон.
 * Поэтому покупатель выбирает не «деталь», а конкретную деталь: со своим состоянием,
 * своими фотографиями и своим VIN донорской машины.
 *
 * Отсюда устройство: галерея, цена и кнопка живут внутри одного клиентского компонента
 * и переключаются вместе. Статику вокруг (заголовок, характеристики, разметка для
 * поисковиков) по-прежнему рисует сервер и передаёт сюда как `header` и `footer`.
 */
export function OfferPicker({
  part,
  rates,
  header,
  footer,
  vinCheckHref,
  locale = 'ru',
}: {
  part: AutoPart;
  rates: Rates;
  header: React.ReactNode;
  footer: React.ReactNode;
  vinCheckHref: string;
  locale?: ShopLocale;
}) {
  const t = ui(locale);
  const title = partTitle(part, locale);
  const offers = part.offers ?? [];
  const [activeId, setActiveId] = useState(offers[0]?.id ?? '');

  /*
   * `view_item` шлём отсюда, а не со страницы: страница серверная, а событие
   * обязано уйти из браузера. Ключ — деталь, а не экземпляр: переключение
   * экземпляров внутри карточки просмотром новой детали не является.
   */
  useEffect(() => {
    trackViewItem({ id: part.id, oem: part.oemNumber, category: part.category });
  }, [part.id, part.oemNumber, part.category]);
  const active = offers.find((offer) => offer.id === activeId) ?? offers[0];

  // Экземпляров может не быть только если данные разъехались: страница детали
  // без товара не собирается. Но падать из-за этого карточка не должна.
  if (!active) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Gallery images={part.images} alt={title} locale={locale} />
        <div className="space-y-5">
          {header}
          <p className="text-sm text-text-secondary">{t.outOfStock}</p>
          {footer}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Ключ по экземпляру: у каждого свои фото, и лента обязана начинаться заново. */}
      <Gallery
        key={active.id}
        images={active.images}
        alt={`${title} — ${t.instance} ${active.id}`}
        locale={locale}
      />

      <div className="space-y-5">
        {header}

        <div className="bg-elevated rounded p-5 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div>
              <span className="text-3xl font-black text-text tracking-tight leading-none">
                {formatPartPrice(active.priceKrw, rates)}
              </span>
            </div>
            <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-2">
              {t.shippingExtra}
            </p>
          </div>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-text-secondary bg-base-darker px-3 py-2 rounded border border-border-subtle">
            <Truck className="w-3.5 h-3.5 text-text-muted" />
            {t.delivery}: {locale === 'en' ? t.deliveryDays : part.deliveryDays}
          </p>
        </div>

        <AddToCart part={part} offer={active} size="large" label={t.addToCart} />

        <OfferDetails offer={active} vinCheckHref={vinCheckHref} locale={locale} />

        {offers.length > 1 && (
          <section aria-label={t.offers} className="space-y-2">
            <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
              {locale === 'en'
                ? `${offers.length} in stock — pick one`
                : `В наличии ${offers.length} шт. — выберите экземпляр`}
            </h2>
            <p className="text-[11px] text-text-muted leading-relaxed">
              {t.offersHint}
            </p>
            <ul className="max-h-96 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
              {offers.map((offer) => (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  rates={rates}
                  active={offer.id === active.id}
                  onPick={() => setActiveId(offer.id)}
                  locale={locale}
                />
              ))}
            </ul>
          </section>
        )}

        {footer}
      </div>
    </div>
  );
}

/** Строка списка: цена, состояние, год и признаки, по которым экземпляры и различают. */
function OfferRow({
  offer,
  rates,
  active,
  onPick,
  locale = 'ru',
}: {
  offer: Offer;
  rates: Rates;
  active: boolean;
  onPick: () => void;
  locale?: ShopLocale;
}) {
  const condition = conditionLabel(offer, locale);

  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        aria-pressed={active}
        className={`w-full text-left rounded border p-3 transition-colors cursor-pointer ${
          active ? 'border-cta bg-elevated' : 'border-border-subtle bg-base-darker hover:border-border'
        }`}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="flex items-center gap-2">
            {active && <Check className="w-3.5 h-3.5 text-cta shrink-0" />}
            <span className="font-black text-text text-sm tracking-tight">
              {formatPartPrice(offer.priceKrw, rates)}
            </span>
          </span>
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${CONDITION_CLASS[condition.tone]}`}>
            {condition.short}
          </span>
        </div>

        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap mt-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
          <span>{offer.year}</span>
          {offer.images.length > 0 && (
            <span>
              {offer.images.length} {ui(locale).photos}
            </span>
          )}
          {offer.pins ? <span>{offer.pinsLayout || offer.pins} конт.</span> : null}
          {offer.colorCode && <span>цвет {offer.colorCode}</span>}
          {offer.donorVin && (
            <span className="flex items-center gap-1 text-success">
              <Fingerprint className="w-3 h-3" />
              VIN
            </span>
          )}
        </div>

        {offer.conditionNotes.length > 0 && (
          <p className="text-[11px] text-text-secondary mt-1.5 leading-snug">
            {terms(offer.conditionNotes, locale, CONDITION_NOTES_EN).join(' · ')}
          </p>
        )}
      </button>
    </li>
  );
}

/** Подробности выбранного экземпляра — то, чего нет у детали вообще. */
function OfferDetails({
  offer,
  vinCheckHref,
  locale = 'ru',
}: {
  offer: Offer;
  vinCheckHref: string;
  locale?: ShopLocale;
}) {
  const t = ui(locale);
  const condition = conditionLabel(offer, locale);
  const specs = [
    term(offer.lampTypeRu, locale, LAMP_TYPE_EN),
    term(offer.completenessRu, locale, COMPLETENESS_EN),
    offer.pins ? `${t.connector} ${offer.pinsLayout || offer.pins} ${t.pins}` : '',
    offer.colorCode
      ? `${t.bodyColor} ${offer.colorCode}${offer.colorName ? ` · ${offer.colorName}` : ''}`
      : '',
    ...terms(offer.featuresRu, locale, FEATURES_EN),
  ].filter(Boolean);

  return (
    <div className="space-y-3">
      <div className="bg-elevated rounded p-4 border border-border-subtle space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t.thisOffer}</h2>
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${CONDITION_CLASS[condition.tone]}`}>
            {condition.short}
          </span>
        </div>

        {offer.conditionNotes.length > 0 && (
          <ul className="text-xs text-text-secondary leading-relaxed list-disc pl-4 space-y-0.5">
            {terms(offer.conditionNotes, locale, CONDITION_NOTES_EN).map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}

        {specs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {specs.map((spec) => (
              <span
                key={spec}
                className="text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-base-darker px-2 py-1 rounded border border-border-subtle"
              >
                {spec}
              </span>
            ))}
          </div>
        )}

        {offer.conditionKo && (
          /* Исходная строка донора. Менеджеру она нужнее любого перевода, а покупателю
             показывает, что описание не сочинено нами. */
          <p className="text-[10px] text-text-dim leading-relaxed pt-1 break-words">
            {locale === 'en' ? 'Seller description' : 'Описание продавца'}: {offer.conditionKo}
          </p>
        )}
      </div>

      {offer.donorVin && (
        <div className="bg-elevated rounded p-4 border border-border-subtle space-y-2">
          <h2 className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
            <Fingerprint className="w-4 h-4 text-success" />
            {t.donorCar}
          </h2>
          <p className="flex items-center gap-2 font-mono text-sm text-text tracking-wider break-all">
            {offer.donorVin}
            <CopyOem value={offer.donorVin} />
          </p>
          <a
            href={vinCheckHref}
            className="inline-block text-[11px] font-bold text-cta hover:underline"
          >
            {t.checkVin}
          </a>
        </div>
      )}
    </div>
  );
}
