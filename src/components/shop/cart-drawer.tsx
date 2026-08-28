'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { CheckCircle2, Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import type { Value } from 'react-phone-number-input';
import { formatUsd, priceUsd } from '@/lib/shop/pricing';
import { partUrl } from '@/lib/shop/urls';
import { partTitle } from '@/lib/shop/labels';
import type { ShopLocale } from '@/lib/shop/terms';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { MessengerSelector } from '@/components/ui/MessengerSelector';
import { trackBeginCheckout, trackLead } from '@/lib/analytics';
import { useCart } from './cart-context';

type Step = 'cart' | 'checkout' | 'success';

/**
 * Корзина и оформление заявки. Это модель «запрос цены»: заказ уходит в Telegram,
 * оплату на сайте не принимаем — поэтому «способ оплаты» здесь только пожелание клиента.
 *
 * Итог считается только за детали. Доставку не прикидываем: тарифа перевозчика у нас нет,
 * а выдуманное число в итоге — это обещание цены, которую никто не подтверждал.
 */
export function CartDrawer() {
  const { items, isOpen, close, updateQuantity, remove, clear, rates } = useCart();
  const locale: ShopLocale = useLocale() === 'en' ? 'en' : 'ru';
  const t = TEXT[locale];

  const [step, setStep] = useState<Step>('cart');
  const [fullName, setFullName] = useState('');
  /** E.164 из PhoneInput — из него сервер строит ссылки wa.me и t.me. */
  const [phone, setPhone] = useState<Value>();
  const [messenger, setMessenger] = useState('whatsapp');
  const [tgUsername, setTgUsername] = useState('');
  /** Страна, а не город: отправляем по всему миру, точный адрес спрашивает менеджер. */
  const [country, setCountry] = useState('');
  const [vin, setVin] = useState('');
  const [consent, setConsent] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Итог складывается из тех же округлённых цен, что стоят в строках: покупатель
  // проверяет сумму глазами, и она обязана сойтись.
  const goodsUsd = items.reduce((sum, item) => sum + priceUsd(item.part.priceKrw, rates) * item.quantity, 0);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    // PhoneInput не даёт браузеру проверить обязательность сам: значение живёт в стейте.
    if (!fullName.trim() || !phone || !country.trim()) return;
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: fullName, phone, messenger, tgUsername, country, vin },
          items: items.map((item) => ({
            // Ключ, по которому сервер дочитывает цену из базы: присланной он не верит.
            id: item.part.id,
            url: partUrl(item.part),
            // В заявку название уходит по-русски всегда: её читает русскоязычный менеджер.
            title: item.part.titleRu,
            oem: item.part.oemNumber,
            quantity: item.quantity,
            priceUsd: priceUsd(item.part.priceKrw, rates),
          })),
          goodsUsd,
          consent,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || t.submitFailed);

      trackLead('shop-checkout');
      setOrderNumber(data.orderNumber);
      setStep('success');
      clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.submitFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = step === 'cart' ? t.titleCart : step === 'checkout' ? t.titleCheckout : t.titleDone;

  return (
    /*
      z-[60], а не z-50: на z-50 уже сидят cookie-баннер и кнопки мессенджеров, и оба
      рендерятся в layout ПОСЛЕ раздела — при равном z-index они выигрывали и накрывали
      нижнюю панель корзины. Кнопка «Оформить заявку» переставала нажиматься, причём молча.
      Корзина — модальное окно, ей и положено быть выше постоянных элементов страницы.
    */
    <div className="fixed inset-0 z-[60] overflow-hidden">
      <div onClick={close} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-base border-l border-border-subtle text-text-secondary flex flex-col shadow-2xl">
          <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-base-darker">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded bg-elevated border border-border-subtle text-text-secondary flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-xs uppercase tracking-widest font-bold text-text">{title}</h2>
                <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted mt-0.5">
                  {items.length} {items.length === 1 ? t.itemOne : t.itemMany}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={close}
              aria-label={t.closeCart}
              className="p-1.5 rounded bg-black/50 border border-border text-text-muted hover:text-text hover:bg-black transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
            {step === 'cart' &&
              (items.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <span className="w-12 h-12 rounded bg-elevated border border-border-subtle text-text-dim flex items-center justify-center mx-auto">
                    <ShoppingCart className="w-5 h-5" />
                  </span>
                  <p className="text-[11px] uppercase tracking-widest font-bold text-text-muted">
                    {t.empty}
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    className="px-5 py-3 rounded bg-elevated hover:bg-surface text-text text-[10px] uppercase tracking-widest font-bold cursor-pointer transition-colors"
                  >
                    {t.backToCatalog}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map(({ part, quantity }) => (
                    <div
                      key={part.id}
                      className="bg-elevated p-4 rounded border border-border-subtle flex gap-4 items-start justify-between"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={part.images[0]}
                        alt={partTitle(part, locale)}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded object-cover border border-border-subtle shrink-0"
                      />

                      <div className="flex-1 min-w-0 space-y-1.5">
                        {part.oemNumber && (
                          <div className="text-[10px] uppercase tracking-widest font-mono text-text-secondary font-bold">
                            OEM: <span className="text-text">{part.oemNumber}</span>
                          </div>
                        )}
                        <div className="text-xs text-text font-bold line-clamp-2 leading-snug">{partTitle(part, locale)}</div>
                        <div className="text-[11px] text-text-secondary font-bold uppercase tracking-widest">
                          {formatUsd(priceUsd(part.priceKrw, rates))} / {t.perItem}
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                          <div className="flex items-center bg-base border border-border-subtle rounded">
                            <button
                              type="button"
                              onClick={() => updateQuantity(part.id, -1)}
                              aria-label={t.decrease}
                              className="p-1.5 text-text-muted hover:text-text cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3 text-[11px] font-mono font-bold text-text">{quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(part.id, 1)}
                              aria-label={t.increase}
                              className="p-1.5 text-text-muted hover:text-text cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => remove(part.id)}
                            title={t.remove}
                            className="text-text-dim hover:text-text-secondary p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            {step === 'checkout' && (
              <form id="checkout-form" onSubmit={submit} className="space-y-4">
                <div className="bg-elevated p-4 rounded border border-border-subtle space-y-1.5">
                  <p className="text-[10px] font-bold text-text uppercase tracking-widest">
                    {t.directBuy}
                  </p>
                  <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
                    {t.notAPayment}
                  </p>
                </div>

                <label className="block space-y-1">
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
                    {t.fullName} *
                  </span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder={t.namePlaceholder}
                    required
                    className="w-full bg-elevated border border-border-subtle rounded px-3 py-2.5 text-xs text-text focus:outline-none focus:border-cta placeholder-text-dim transition-colors"
                  />
                </label>

                {/*
                  Телефон через общий PhoneInput — с выбором страны и в формате E.164.
                  Прежнее поле было обычной строкой с подсказкой «+7 999 000-00-00»:
                  покупателю из Италии оно диктовало российский формат, а из E.164
                  сервер строит ссылки wa.me и t.me, по которым менеджер и пишет.
                */}
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold text-text-muted uppercase tracking-widest">
                    {t.phone} *
                  </span>
                  <PhoneInput value={phone} onChange={setPhone} required />
                </div>

                {/*
                  «Как вам ответить» вместо поля Telegram. Мессенджер — это способ связи,
                  а не имя пользователя: покупатель из-за рубежа чаще на WhatsApp, и поле
                  с одним «@username» молча предполагало Telegram.
                */}
                <MessengerSelector
                  messenger={messenger}
                  onMessengerChange={setMessenger}
                  tgUsername={tgUsername}
                  onTgUsernameChange={setTgUsername}
                  label={t.howToReply}
                />

                {/*
                  Страна, а не город из списка. Список был российский, а отправляем мы
                  по всему миру: покупателю из Италии пришлось бы выбрать «Москва»,
                  и менеджер получил бы заявку с чужим городом. Адрес ПВЗ СДЭК убран
                  по той же причине — точный адрес менеджер спрашивает при расчёте
                  доставки, до этого он не нужен.
                */}
                <label className="block space-y-1">
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
                    {t.country} *
                  </span>
                  <input
                    type="text"
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    placeholder={t.countryPlaceholder}
                    required
                    className="w-full bg-elevated border border-border-subtle rounded px-3 py-2.5 text-xs text-text focus:outline-none focus:border-cta placeholder-text-dim transition-colors"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
                    {t.vin} <span className="text-text-dim normal-case">({t.optional})</span>
                  </span>
                  <input
                    type="text"
                    value={vin}
                    onChange={(event) => setVin(event.target.value.toUpperCase())}
                    placeholder="KMHXX00XXXXX000000"
                    maxLength={17}
                    className="w-full bg-elevated border border-border-subtle rounded px-3 py-2.5 text-xs text-text font-mono tracking-widest focus:outline-none focus:border-cta placeholder-text-dim transition-colors"
                  />
                </label>

                {/*
                  152-ФЗ: заявка увозит имя, телефон, страну и VIN, поэтому согласие
                  обязательно и должно быть осознанным. Галочку по умолчанию не ставим —
                  предзаполненное согласие согласием не считается. На форме kmotors,
                  с которой снята эта раскладка, галочки нет; у нас она остаётся: сервер
                  проверяет согласие и без него заявку не примет.
                */}
                <label className="flex items-start gap-3 p-3 bg-elevated rounded border border-border-subtle cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                    required
                    className="accent-cta w-3.5 h-3.5 mt-0.5 shrink-0"
                  />
                  <span className="text-[10px] text-text-secondary leading-relaxed">
                    {t.consentBefore}{' '}
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="text-cta hover:underline"
                    >
                      {t.consentPolicy}
                    </Link>
                    {t.consentAfter}
                  </span>
                </label>

                {error && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-950/40 border border-red-900/50 rounded p-3">
                    {error}
                  </p>
                )}
              </form>
            )}

            {step === 'success' && (
              <div className="text-center py-6 space-y-5">
                <span className="w-14 h-14 bg-elevated text-success rounded border border-border flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </span>
                <h3 className="text-lg font-black text-text uppercase tracking-tight">{t.accepted(orderNumber)}</h3>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-relaxed">
                  {t.acceptedHint}
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="px-5 py-3 rounded bg-elevated hover:bg-surface text-text text-[10px] uppercase tracking-widest font-bold cursor-pointer transition-colors"
                >
                  {t.backToCatalog}
                </button>
              </div>
            )}
          </div>

          {items.length > 0 && step !== 'success' && (
            <div className="p-5 border-t border-border-subtle bg-base-darker space-y-4">
              <div className="space-y-2 text-[11px] font-bold uppercase tracking-widest text-text-muted">
                <div className="flex justify-between">
                  <span>{t.shipping}:</span>
                  <span className="text-text-secondary normal-case tracking-normal font-medium text-right">
                    {t.shippingHint}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-text pt-3 border-t border-border-subtle">
                  <span>{t.total}:</span>
                  <span className="font-mono text-right">{formatUsd(goodsUsd)}</span>
                </div>
              </div>

              {step === 'cart' ? (
                <button
                  type="button"
                  onClick={() => {
                    trackBeginCheckout(items.length);
                    setStep('checkout');
                  }}
                  className="w-full py-4 rounded bg-cta hover:bg-cta-hover text-base-darker font-black text-[11px] uppercase tracking-widest cursor-pointer transition-colors"
                >
                  {t.checkout}
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('cart')}
                    className="px-5 py-4 rounded bg-elevated hover:bg-surface border border-border-subtle text-text-secondary text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors"
                  >{t.back}</button>
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={isSubmitting}
                    className="flex-1 py-4 rounded bg-cta hover:bg-cta-hover text-base-darker font-black text-[10px] uppercase tracking-widest cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? t.sending : t.send}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Тексты корзины. Живут здесь, а не в общем словаре раздела: это проза формы, и она
 * используется только тут. Заявка в Telegram при этом уходит по-русски в любом случае —
 * её собирает сервер, а читает русскоязычный менеджер.
 */
const TEXT = {
  ru: {
    titleCart: 'Корзина деталей',
    titleCheckout: 'Оформление заявки',
    titleDone: 'Заявка принята',
    itemOne: 'позиция',
    itemMany: 'позиций',
    closeCart: 'Закрыть корзину',
    empty: 'В корзине пока нет деталей',
    backToCatalog: 'Вернуться в каталог',
    decrease: 'Убрать одну',
    increase: 'Добавить одну',
    remove: 'Удалить',
    directBuy: 'Прямой выкуп с авторазборок Южной Кореи',
    notAPayment: 'Это заявка, а не оплата. Менеджер свяжется и подтвердит наличие и итоговую сумму',
    fullName: 'Ваше имя',
    namePlaceholder: 'Иван Иванов',
    phone: 'Телефон',
    howToReply: 'Как вам ответить?',
    country: 'Страна доставки',
    countryPlaceholder: 'Например, Казахстан',
    vin: 'VIN-номер автомобиля',
    optional: 'необязательно',
    consentBefore: 'Согласен на обработку персональных данных в соответствии с',
    consentPolicy: 'политикой',
    consentAfter: '. Данные нужны, чтобы связаться и оформить отправку.',
    shipping: 'Доставка',
    shippingHint: 'менеджер рассчитает по вашему адресу',
    total: 'Итого за детали',
    checkout: 'Оформить заявку',
    back: 'Назад',
    send: 'Отправить заявку',
    sending: 'Отправка…',
    submitFailed: 'Не удалось отправить заявку',
    accepted: (order: string) => `Заявка ${order} принята`,
    acceptedHint: 'Менеджер свяжется с вами, подтвердит наличие и пришлёт фото детали перед отправкой.',
    perItem: 'шт',
  },
  en: {
    titleCart: 'Parts cart',
    titleCheckout: 'Your request',
    titleDone: 'Request received',
    itemOne: 'item',
    itemMany: 'items',
    closeCart: 'Close the cart',
    empty: 'No parts in the cart yet',
    backToCatalog: 'Back to the catalog',
    decrease: 'Remove one',
    increase: 'Add one',
    remove: 'Delete',
    directBuy: 'Bought directly at South Korean salvage yards',
    notAPayment:
      'This is a request, not a payment. The manager will get in touch and confirm the item and the final amount',
    fullName: 'Your name',
    namePlaceholder: 'John Smith',
    phone: 'Phone',
    howToReply: 'How should we reply?',
    country: 'Delivery country',
    countryPlaceholder: 'For example, Kazakhstan',
    vin: 'Car VIN',
    optional: 'optional',
    consentBefore: 'I agree to the processing of my personal data in line with the',
    consentPolicy: 'privacy policy',
    consentAfter: '. We need the details to reach you and arrange the shipment.',
    shipping: 'Shipping',
    shippingHint: 'the manager will work it out for your address',
    total: 'Parts total',
    checkout: 'Place a request',
    back: 'Back',
    send: 'Send the request',
    sending: 'Sending…',
    submitFailed: 'Could not send the request',
    accepted: (order: string) => `Request ${order} received`,
    acceptedHint:
      'The manager will get in touch, confirm the item is there and send photos before dispatch.',
    perItem: 'item',
  },
} as const;
