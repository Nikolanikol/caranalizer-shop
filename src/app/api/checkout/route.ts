import { NextResponse } from 'next/server';
import { submitLead } from '@/lib/leads';
import { messengerLines } from '@/lib/messenger-links';
import { formatUsd } from '@/lib/shop/pricing';
import { getRates } from '@/lib/shop/rates';

/**
 * Заявка из корзины раздела запчастей. Роут разбирает тело и валидирует —
 * отправка и запись живут в `lib/leads`, одни на все три формы сайта.
 *
 * Раньше именно этот роут требовал `TELEGRAM_WORK_CHAT_ID` и не читал `TELEGRAM_CHAT_ID`,
 * тогда как две другие формы — наоборот. На окружении, настроенном под исходный
 * caranalizer, оформление заказа отвечало 503 на каждую попытку.
 */

interface CheckoutItem {
  /** Полный путь товара. Слаг не годится: он уникален только внутри марки и модели. */
  url?: string;
  title?: string;
  oem?: string;
  quantity?: unknown;
  priceRub?: unknown;
}

/** Позиций в сообщении: остальное менеджер смотрит в базе, чтобы Telegram не обрезал. */
const MAX_ITEMS_IN_MESSAGE = 30;

const PAYMENT_LABELS: Record<string, string> = {
  qwikpay: 'QwikPay / Золотая Корона',
  invoice_ur: 'Инвойс на юрлицо',
  paypal: 'PayPal',
};

/** Приходит из браузера, то есть чему угодно. Числа приводим сами. */
function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function rub(value: unknown): string {
  return `${num(value).toLocaleString('ru-RU')} ₽`;
}

/**
 * «5 000 ₽ (≈ $60)». Курс берётся здесь, а не приходит из браузера: тело запроса
 * подделывается, а сумма в заявке — то, по чему менеджер выставляет счёт.
 */
function withUsd(value: unknown, rubPerUsd: number): string {
  return `${rub(value)} (${formatUsd(Math.round(num(value) / rubPerUsd / 10) * 10)})`;
}

export async function POST(request: Request) {
  let payload: {
    customer?: Record<string, string>;
    items?: CheckoutItem[];
    goodsRub?: number;
    consent?: boolean;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Некорректный запрос' }, { status: 400 });
  }

  const { customer = {}, goodsRub = 0, consent = false } = payload;
  // Тело запроса — не наш код: массив может оказаться не массивом.
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (!customer.name?.trim() || !customer.phone?.trim() || items.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Заполните имя, телефон и добавьте товар' },
      { status: 400 },
    );
  }

  // Галочку в браузере можно обойти, а данные тут настоящие — проверяем и на сервере.
  if (!consent) {
    return NextResponse.json(
      { success: false, error: 'Нужно согласие на обработку персональных данных' },
      { status: 400 },
    );
  }

  const { rubPerUsd } = await getRates();
  const orderNumber = `KP-${Date.now().toString().slice(-6)}`;
  const payment = customer.payment ? PAYMENT_LABELS[customer.payment] ?? customer.payment : null;

  const itemLines = items
    .slice(0, MAX_ITEMS_IN_MESSAGE)
    .map(
      (item, i) =>
        `${i + 1}. ${item.title ?? '—'}\n   OEM: ${item.oem || '—'}\n   ${item.url ?? ''}\n   ` +
        `${num(item.quantity)} шт. × ${withUsd(item.priceRub, rubPerUsd)}`,
    );
  const rest = items.length - MAX_ITEMS_IN_MESSAGE;

  try {
    const { ok } = await submitLead({
      source: 'shop-checkout',
      title: `🛒 Новая заявка ${orderNumber}`,
      name: customer.name.trim(),
      phone: customer.phone.trim(),
      vin: customer.vin || null,
      messenger: customer.telegram ? 'telegram' : null,
      tgUsername: customer.telegram || null,
      message: [
        `Заявка ${orderNumber} из каталога запчастей`,
        `Город: ${customer.city || '—'}, адрес: ${customer.address || '—'}`,
        payment && `Оплата: ${payment}`,
        `Итого за детали: ${withUsd(goodsRub, rubPerUsd)}`,
        ...items.map((item) => `• ${item.title ?? '—'} — OEM ${item.oem || '—'}, ${num(item.quantity)} шт.`),
      ]
        .filter(Boolean)
        .join('\n'),
      lines: [
        `👤 Клиент: ${customer.name.trim()}`,
        `📞 Телефон: ${customer.phone.trim()}`,
        customer.telegram && `✈️ Telegram: ${customer.telegram}`,
        ...messengerLines({
          phone: customer.phone,
          messenger: customer.telegram ? 'telegram' : undefined,
          tgUsername: customer.telegram,
        }),
        `📍 Город: ${customer.city || '—'}`,
        `🏠 Адрес: ${customer.address || '—'}`,
        customer.vin && `🚗 VIN: ${customer.vin}`,
        payment && `💳 Оплата: ${payment}`,
        '',
        '📦 Товары:',
        ...itemLines,
        rest > 0 && `…и ещё ${rest} позиций — уточните у клиента`,
        '',
        `💰 Итого за детали: ${withUsd(goodsRub, rubPerUsd)}`,
        '🚚 Доставка: рассчитать по городу',
      ],
    });

    if (!ok) {
      return NextResponse.json(
        { success: false, error: 'Не удалось отправить заявку' },
        { status: 502 },
      );
    }
    return NextResponse.json({ success: true, orderNumber });
  } catch (error) {
    console.error('[/api/checkout]', error);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}
