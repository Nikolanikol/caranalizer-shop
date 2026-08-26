'use client';

import React, { useState } from 'react';
import { Check, Fingerprint, Truck } from 'lucide-react';
import type { AutoPart, Offer } from '@/types/part';
import type { Rates } from '@/lib/shop/pricing';
import { formatPartPrice, formatPartPriceUsd } from '@/lib/shop/pricing';
import { CONDITION_CLASS, conditionLabel } from '@/lib/shop/labels';
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
}: {
  part: AutoPart;
  rates: Rates;
  header: React.ReactNode;
  footer: React.ReactNode;
  vinCheckHref: string;
}) {
  const offers = part.offers ?? [];
  const [activeId, setActiveId] = useState(offers[0]?.id ?? '');
  const active = offers.find((offer) => offer.id === activeId) ?? offers[0];

  // Экземпляров может не быть только если данные разъехались: страница детали
  // без товара не собирается. Но падать из-за этого карточка не должна.
  if (!active) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Gallery images={part.images} alt={part.titleRu} />
        <div className="space-y-5">
          {header}
          <p className="text-sm text-text-secondary">Этой детали сейчас нет в наличии.</p>
          {footer}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Ключ по экземпляру: у каждого свои фото, и лента обязана начинаться заново. */}
      <Gallery key={active.id} images={active.images} alt={`${part.titleRu} — экземпляр ${active.id}`} />

      <div className="space-y-5">
        {header}

        <div className="bg-elevated rounded p-5 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
              <span className="text-3xl font-black text-text tracking-tight leading-none">
                {formatPartPrice(active.priceKrw, rates)}
              </span>
              <span className="text-base font-bold text-text-muted leading-none">
                {formatPartPriceUsd(active.priceKrw, rates)}
              </span>
            </div>
            <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-2">
              Доставка оплачивается отдельно
            </p>
          </div>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-text-secondary bg-base-darker px-3 py-2 rounded border border-border-subtle">
            <Truck className="w-3.5 h-3.5 text-text-muted" />
            Доставка: {part.deliveryDays}
          </p>
        </div>

        <AddToCart part={part} offer={active} size="large" />

        <OfferDetails offer={active} vinCheckHref={vinCheckHref} />

        {offers.length > 1 && (
          <section aria-label="Экземпляры этой детали" className="space-y-2">
            <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
              В наличии {offers.length} шт. — выберите экземпляр
            </h2>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Это разные детали с разных машин. Цена, состояние и фотографии у каждой свои.
            </p>
            <ul className="max-h-96 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
              {offers.map((offer) => (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  rates={rates}
                  active={offer.id === active.id}
                  onPick={() => setActiveId(offer.id)}
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
}: {
  offer: Offer;
  rates: Rates;
  active: boolean;
  onPick: () => void;
}) {
  const condition = conditionLabel(offer);

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
          {offer.images.length > 0 && <span>{offer.images.length} фото</span>}
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
          <p className="text-[11px] text-text-secondary mt-1.5 leading-snug">{offer.conditionNotes.join(' · ')}</p>
        )}
      </button>
    </li>
  );
}

/** Подробности выбранного экземпляра — то, чего нет у детали вообще. */
function OfferDetails({ offer, vinCheckHref }: { offer: Offer; vinCheckHref: string }) {
  const condition = conditionLabel(offer);
  const specs = [
    offer.lampTypeRu,
    offer.completenessRu,
    offer.pins ? `Разъём ${offer.pinsLayout || offer.pins} контактов` : '',
    offer.colorCode ? `Цвет кузова ${offer.colorCode}${offer.colorName ? ` · ${offer.colorName}` : ''}` : '',
    ...offer.featuresRu,
  ].filter(Boolean);

  return (
    <div className="space-y-3">
      <div className="bg-elevated rounded p-4 border border-border-subtle space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Этот экземпляр</h2>
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${CONDITION_CLASS[condition.tone]}`}>
            {condition.short}
          </span>
        </div>

        {offer.conditionNotes.length > 0 && (
          <ul className="text-xs text-text-secondary leading-relaxed list-disc pl-4 space-y-0.5">
            {offer.conditionNotes.map((note) => (
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
            Описание продавца: {offer.conditionKo}
          </p>
        )}
      </div>

      {offer.donorVin && (
        <div className="bg-elevated rounded p-4 border border-border-subtle space-y-2">
          <h2 className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
            <Fingerprint className="w-4 h-4 text-success" />
            Машина, с которой снята деталь
          </h2>
          <p className="flex items-center gap-2 font-mono text-sm text-text tracking-wider break-all">
            {offer.donorVin}
            <CopyOem value={offer.donorVin} />
          </p>
          <a
            href={vinCheckHref}
            className="inline-block text-[11px] font-bold text-cta hover:underline"
          >
            Проверить историю этой машины по VIN →
          </a>
        </div>
      )}
    </div>
  );
}
