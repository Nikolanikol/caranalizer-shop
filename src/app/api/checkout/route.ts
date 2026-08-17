import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { messengerLines } from '@/lib/messenger-links';

/**
 * Приём заявки из корзины раздела запчастей.
 *
 * Токен только из окружения: захардкоженный запасной вариант однажды уже лежал
 * в исходниках. Если переменных нет — отвечаем ошибкой, а не «спасибо»:
 * молчаливая заглушка скрыла бы потерянные заявки.
 *
 * После слияния с caranalizer заявка дополнительно ложится в общую таблицу leads —
 * иначе заказы деталей остались бы единственным потоком обращений мимо воронки,
 * видимым только в переписке Telegram.
 */

interface CheckoutItem {
  /** Полный путь товара. Слаг сюда не годится: он уникален только внутри марки и модели. */
  url: string;
  title: string;
  oem: string;
  quantity: number;
  priceRub: number;
}

/**
 * Telegram режет сообщение на 4096 символах. Позиций больше — заявка уйдёт обрезанной
 * или не уйдёт вовсе, поэтому список ограничиваем сами и честно пишем, сколько осталось.
 */
const MAX_ITEMS_IN_MESSAGE = 30;

/** Приходит из браузера, то есть чему угодно. Числа приводим сами, иначе падаем на toLocaleString. */
function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Должны совпадать с вариантами в cart-drawer и с текстом на /zapchasti/dostavka-i-oplata.
const PAYMENT_LABELS: Record<string, string> = {
  qwikpay: 'QwikPay / Золотая Корона',
  invoice_ur: 'Инвойс на юрлицо',
  paypal: 'PayPal',
};

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_WORK_CHAT_ID;

  if (!token || !chatId) {
    console.error('TELEGRAM_BOT_TOKEN / TELEGRAM_WORK_CHAT_ID не заданы — заявка не доставлена');
    return NextResponse.json({ success: false, error: 'Оформление временно недоступно' }, { status: 503 });
  }

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
  if (!customer.name || !customer.phone || items.length === 0) {
    return NextResponse.json({ success: false, error: 'Заполните имя, телефон и добавьте товар' }, { status: 400 });
  }

  // Галочку в браузере можно обойти, а данные тут настоящие — проверяем и на сервере.
  if (!consent) {
    return NextResponse.json(
      { success: false, error: 'Нужно согласие на обработку персональных данных' },
      { status: 400 },
    );
  }

  const orderNumber = `KP-${Date.now().toString().slice(-6)}`;

  // Ссылки на мессенджеры клиента: менеджер открывает чат в один тап, а не копирует номер.
  const contactLines = messengerLines({
    phone: customer.phone,
    messenger: customer.telegram ? 'telegram' : undefined,
    tgUsername: customer.telegram,
  });

  const lines = [
    `🛒 <b>Новая заявка ${orderNumber}</b>`,
    '',
    `👤 <b>Клиент:</b> ${escapeHtml(customer.name)}`,
    `📞 <b>Телефон:</b> ${escapeHtml(customer.phone)}`,
    customer.telegram ? `✈️ <b>Telegram:</b> ${escapeHtml(customer.telegram)}` : '',
    ...contactLines.map(escapeHtml),
    `📍 <b>Город:</b> ${escapeHtml(customer.city)}`,
    `🏠 <b>Адрес:</b> ${escapeHtml(customer.address)}`,
    customer.vin ? `🚗 <b>VIN:</b> ${escapeHtml(customer.vin)}` : '',
    customer.payment ? `💳 <b>Оплата:</b> ${escapeHtml(PAYMENT_LABELS[customer.payment] ?? customer.payment)}` : '',
    '',
    '📦 <b>Товары:</b>',
    ...items
      .slice(0, MAX_ITEMS_IN_MESSAGE)
      .map(
        (item, index) =>
          `${index + 1}. ${escapeHtml(item.title)}\n   OEM: <code>${escapeHtml(item.oem || '—')}</code>\n   ${escapeHtml(item.url)}\n   ${num(item.quantity)} шт. × ${num(item.priceRub).toLocaleString('ru-RU')} ₽`,
      ),
    items.length > MAX_ITEMS_IN_MESSAGE ? `…и ещё ${items.length - MAX_ITEMS_IN_MESSAGE} позиций — уточните у клиента` : '',
    '',
    `💰 <b>Итого за детали:</b> ${num(goodsRub).toLocaleString('ru-RU')} ₽`,
    '🚚 <b>Доставка:</b> рассчитать по городу',
  ].filter(Boolean);

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: lines.join('\n'), parse_mode: 'HTML' }),
    });

    const result = await response.json();
    if (!result.ok) {
      console.error('Telegram вернул ошибку:', result);
      return NextResponse.json({ success: false, error: 'Не удалось отправить заявку' }, { status: 502 });
    }
  } catch (error) {
    console.error('Заявка не ушла в Telegram:', error);
    return NextResponse.json({ success: false, error: 'Не удалось отправить заявку' }, { status: 502 });
  }

  // База — после Telegram и в отдельном try: заявка уже доставлена менеджеру,
  // и падение записи в воронку не повод показывать клиенту ошибку.
  try {
    await createServerClient()
      .from('leads')
      .insert({
        name: customer.name,
        phone: customer.phone,
        vin: customer.vin?.trim() || null,
        message: [
          `Заявка ${orderNumber} из каталога запчастей`,
          `Город: ${customer.city || '—'}, адрес: ${customer.address || '—'}`,
          customer.payment ? `Оплата: ${PAYMENT_LABELS[customer.payment] ?? customer.payment}` : null,
          `Итого за детали: ${num(goodsRub).toLocaleString('ru-RU')} ₽`,
          ...items.map((item) => `• ${item.title} — OEM ${item.oem || '—'}, ${num(item.quantity)} шт.`),
        ]
          .filter(Boolean)
          .join('\n'),
        messenger: customer.telegram ? 'telegram' : null,
        tg_username: customer.telegram?.trim() || null,
        source_page: 'shop-checkout',
        site: 'caranalizer',
      });
  } catch (error) {
    console.error('leads insert failed:', error);
  }

  return NextResponse.json({ success: true, orderNumber });
}
