'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Building2, CheckCircle2, CreditCard, Minus, Plus, QrCode, ShoppingCart, Trash2, X } from 'lucide-react';
import { formatRub, formatUsd, priceRub, priceUsd } from '@/lib/shop/pricing';
import { partUrl } from '@/lib/shop/urls';
import { RUSSIAN_CITIES } from '@/lib/shop/delivery';
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

  const [step, setStep] = useState<Step>('cart');
  const [city, setCity] = useState(RUSSIAN_CITIES[0].name);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [address, setAddress] = useState('');
  const [vin, setVin] = useState('');
  const [payment, setPayment] = useState<'qwikpay' | 'invoice_ur' | 'paypal'>('qwikpay');
  const [consent, setConsent] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Итог складывается из тех же округлённых цен, что стоят в строках: покупатель
  // проверяет сумму глазами, и она обязана сойтись в обеих валютах.
  const goodsRub = items.reduce((sum, item) => sum + priceRub(item.part.priceKrw, rates) * item.quantity, 0);
  const goodsUsd = items.reduce((sum, item) => sum + priceUsd(item.part.priceKrw, rates) * item.quantity, 0);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: fullName, phone, telegram, city, address, vin, payment },
          items: items.map((item) => ({
            url: partUrl(item.part),
            title: item.part.titleRu,
            oem: item.part.oemNumber,
            quantity: item.quantity,
            priceRub: priceRub(item.part.priceKrw, rates),
          })),
          goodsRub,
          consent,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Не удалось отправить заявку');

      setOrderNumber(data.orderNumber);
      setStep('success');
      clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить заявку');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = step === 'cart' ? 'Корзина деталей' : step === 'checkout' ? 'Оформление заявки' : 'Заявка принята';

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
                  {items.length} {items.length === 1 ? 'позиция' : 'позиций'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={close}
              aria-label="Закрыть корзину"
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
                    В корзине пока нет деталей
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    className="px-5 py-3 rounded bg-elevated hover:bg-surface text-text text-[10px] uppercase tracking-widest font-bold cursor-pointer transition-colors"
                  >
                    Вернуться в каталог
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
                        alt={part.titleRu}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded object-cover border border-border-subtle shrink-0"
                      />

                      <div className="flex-1 min-w-0 space-y-1.5">
                        {part.oemNumber && (
                          <div className="text-[10px] uppercase tracking-widest font-mono text-text-secondary font-bold">
                            OEM: <span className="text-text">{part.oemNumber}</span>
                          </div>
                        )}
                        <div className="text-xs text-text font-bold line-clamp-2 leading-snug">{part.titleRu}</div>
                        <div className="text-[11px] text-text-secondary font-bold uppercase tracking-widest">
                          {formatRub(priceRub(part.priceKrw, rates))} / шт
                          <span className="text-text-muted normal-case tracking-normal">
                            {' '}
                            ({formatUsd(priceUsd(part.priceKrw, rates))})
                          </span>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                          <div className="flex items-center bg-base border border-border-subtle rounded">
                            <button
                              type="button"
                              onClick={() => updateQuantity(part.id, -1)}
                              aria-label="Убрать одну"
                              className="p-1.5 text-text-muted hover:text-text cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3 text-[11px] font-mono font-bold text-text">{quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(part.id, 1)}
                              aria-label="Добавить одну"
                              className="p-1.5 text-text-muted hover:text-text cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => remove(part.id)}
                            title="Удалить"
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
                    Прямой выкуп с авторазборок Южной Кореи
                  </p>
                  <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
                    Это заявка, а не оплата. Менеджер свяжется и подтвердит наличие и итоговую сумму
                  </p>
                </div>

                <label className="block space-y-1">
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">ФИО получателя</span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                    className="w-full bg-elevated border border-border-subtle rounded px-3 py-2.5 text-xs text-text focus:outline-none focus:border-cta placeholder-text-dim transition-colors"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Телефон</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="+7 999 000-00-00"
                      required
                      className="w-full bg-elevated border border-border-subtle rounded px-3 py-2.5 text-xs text-text focus:outline-none focus:border-cta placeholder-text-dim transition-colors"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Telegram</span>
                    <input
                      type="text"
                      value={telegram}
                      onChange={(event) => setTelegram(event.target.value)}
                      placeholder="@username"
                      className="w-full bg-elevated border border-border-subtle rounded px-3 py-2.5 text-xs text-text focus:outline-none focus:border-cta placeholder-text-dim transition-colors"
                    />
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Город получения</span>
                  <select
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    className="w-full bg-elevated border border-border-subtle rounded px-3 py-2.5 text-xs text-text focus:outline-none focus:border-cta transition-colors cursor-pointer"
                  >
                    {RUSSIAN_CITIES.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name} — {item.days}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
                    Адрес ПВЗ СДЭК или улица
                  </span>
                  <input
                    type="text"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    required
                    className="w-full bg-elevated border border-border-subtle rounded px-3 py-2.5 text-xs text-text focus:outline-none focus:border-cta placeholder-text-dim transition-colors"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
                    VIN автомобиля — сверим перед выкупом
                  </span>
                  <input
                    type="text"
                    value={vin}
                    onChange={(event) => setVin(event.target.value.toUpperCase())}
                    maxLength={17}
                    className="w-full bg-elevated border border-border-subtle rounded px-3 py-2.5 text-xs text-text font-mono tracking-widest focus:outline-none focus:border-cta placeholder-text-dim transition-colors"
                  />
                </label>

                <fieldset className="space-y-2">
                  <legend className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-2">
                    Удобный способ оплаты
                  </legend>
                  {(
                    [
                      // Способы должны совпадать с PAYMENT_LABELS в api/checkout и с текстом
                      // на /zapchasti/dostavka-i-oplata: это одна и та же оферта в трёх местах.
                      { value: 'qwikpay', label: 'QwikPay / Золотая Корона', icon: QrCode },
                      { value: 'invoice_ur', label: 'Инвойс на юрлицо', icon: Building2 },
                      { value: 'paypal', label: 'PayPal', icon: CreditCard },
                    ] as const
                  ).map(({ value, label, icon: Icon }) => (
                    <label
                      key={value}
                      className="flex items-center gap-3 p-3 bg-elevated rounded border border-border-subtle cursor-pointer hover:bg-surface transition-colors"
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={payment === value}
                        onChange={() => setPayment(value)}
                        className="accent-cta w-3 h-3"
                      />
                      <Icon className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-[10px] uppercase font-bold tracking-wide text-text-secondary">{label}</span>
                    </label>
                  ))}
                </fieldset>

                {/*
                  152-ФЗ: заявка увозит ФИО, телефон, адрес и VIN, поэтому согласие обязательно
                  и должно быть осознанным. Галочку по умолчанию не ставим — предзаполненное
                  согласие согласием не считается.
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
                    Согласен на обработку персональных данных в соответствии с{' '}
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="text-cta hover:underline"
                    >
                      политикой
                    </Link>
                    . Данные нужны, чтобы связаться и оформить отправку.
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
                <h3 className="text-lg font-black text-text uppercase tracking-tight">Заявка {orderNumber} принята</h3>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-relaxed">
                  Менеджер свяжется с вами, подтвердит наличие и пришлёт фото детали перед отправкой.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="px-5 py-3 rounded bg-elevated hover:bg-surface text-text text-[10px] uppercase tracking-widest font-bold cursor-pointer transition-colors"
                >
                  Вернуться в каталог
                </button>
              </div>
            )}
          </div>

          {items.length > 0 && step !== 'success' && (
            <div className="p-5 border-t border-border-subtle bg-base-darker space-y-4">
              <div className="space-y-2 text-[11px] font-bold uppercase tracking-widest text-text-muted">
                <div className="flex justify-between">
                  <span>Доставка:</span>
                  <span className="text-text-secondary normal-case tracking-normal font-medium text-right">
                    менеджер рассчитает по вашему городу
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-text pt-3 border-t border-border-subtle">
                  <span>Итого за детали:</span>
                  <span className="font-mono text-right">
                    {formatRub(goodsRub)}
                    <span className="block text-[11px] font-bold text-text-muted normal-case tracking-normal">
                      {formatUsd(goodsUsd)}
                    </span>
                  </span>
                </div>
              </div>

              {step === 'cart' ? (
                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="w-full py-4 rounded bg-cta hover:bg-cta-hover text-base-darker font-black text-[11px] uppercase tracking-widest cursor-pointer transition-colors"
                >
                  Оформить заявку
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('cart')}
                    className="px-5 py-4 rounded bg-elevated hover:bg-surface border border-border-subtle text-text-secondary text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors"
                  >
                    Назад
                  </button>
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={isSubmitting}
                    className="flex-1 py-4 rounded bg-cta hover:bg-cta-hover text-base-darker font-black text-[10px] uppercase tracking-widest cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Отправка…' : 'Отправить заявку'}
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
