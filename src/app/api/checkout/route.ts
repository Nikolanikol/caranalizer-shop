import { NextResponse } from 'next/server';
import { submitLead } from '@/lib/leads';
import { messengerLines } from '@/lib/messenger-links';
import { getPricesKrwByCartId } from '@/lib/shop/catalog';
import { formatRubApprox, formatUsd, priceRub, priceUsd, type Rates } from '@/lib/shop/pricing';
import { getRates } from '@/lib/shop/rates';

/**
 * Заявка из корзины раздела запчастей. Роут разбирает тело и валидирует —
 * отправка и запись живут в `lib/leads`, одни на все три формы сайта.
 *
 * Раньше именно этот роут требовал `TELEGRAM_WORK_CHAT_ID` и не читал `TELEGRAM_CHAT_ID`,
 * тогда как две другие формы — наоборот. На окружении, настроенном под исходный
 * caranalizer, оформление заказа отвечало 503 на каждую попытку.
 *
 * **Цену считает сервер, а не браузер.** До этого цена приходила из тела запроса
 * и печаталась как есть: подделанный запрос присылал «1 ₽ за штуку», и менеджер выставлял
 * счёт по этой цифре. Теперь воны дочитываются из базы по ключу позиции, доллары
 * считает `pricing.ts` по курсу ЦБ, а присланное используется только для сверки —
 * расхождение попадает в заявку отдельной строкой.
 *
 * **Цена оферты — доллар** (с 28.08.2026), и сверяемся мы по нему. Рубль в заявке
 * остался справочным, со знаком «≈»: менеджер ведёт и российских покупателей, и рублёвый
 * ориентир ему полезен. Но договорённость с покупателем — та, что он видел на сайте,
 * то есть долларовая.
 */

interface CheckoutItem {
  /**
   * Ключ позиции корзины. У выбранного экземпляра это `product_no` донора, у товара
   * из списка — путь товара. По нему сервер и достаёт настоящую цену.
   */
  id?: string;
  /** Полный путь товара. Слаг не годится: он уникален только внутри марки и модели. */
  url?: string;
  title?: string;
  oem?: string;
  quantity?: unknown;
  /** Цена, показанная покупателю, в долларах. Только для сверки — в счёт идёт цена из базы. */
  priceUsd?: unknown;
}

/** Позиций в сообщении: остальное менеджер смотрит в базе, чтобы Telegram не обрезал. */
const MAX_ITEMS_IN_MESSAGE = 30;

/**
 * Сколько позиций вообще разбираем. Тело запроса подделывается, и без границы
 * присланный массив на сто тысяч строк ушёл бы в запрос к базе целиком.
 */
const MAX_ITEMS = 100;

/** Больше одной детали в заявке бывает, сотня одинаковых фар — нет. */
const MAX_QUANTITY = 99;

/** Приходит из браузера, то есть чему угодно. Числа приводим сами. */
function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Количество из тела запроса: целое, не меньше одного и не больше сотни. */
function quantityOf(value: unknown): number {
  return Math.min(MAX_QUANTITY, Math.max(1, Math.round(num(value))));
}


/**
 * «$60 (≈ 5 000 ₽)» — доллар цена, рубль ориентир. Обе посчитаны сервером из вон,
 * а не переведены одна в другую.
 */
function money(valueRub: number, valueUsd: number): string {
  return `${formatUsd(valueUsd)} (${formatRubApprox(valueRub)})`;
}

/** Позиция заявки с ценой, посчитанной на сервере. `null` — такой позиции нет в каталоге. */
interface PricedItem {
  item: CheckoutItem;
  quantity: number;
  rub: number | null;
  usd: number | null;
}

function priceItems(items: CheckoutItem[], prices: Map<string, number>, rates: Rates): PricedItem[] {
  return items.map((item) => {
    const krw = item.id ? prices.get(item.id) : undefined;
    return {
      item,
      quantity: quantityOf(item.quantity),
      rub: krw === undefined ? null : priceRub(krw, rates),
      usd: krw === undefined ? null : priceUsd(krw, rates),
    };
  });
}

/** Строка позиции для менеджера. Непроверенная цена подписывается, а не подставляется. */
function itemLine(priced: PricedItem, index: number): string {
  const { item, quantity, rub: perRub, usd: perUsd } = priced;
  const price =
    perRub === null || perUsd === null
      ? '⚠️ цены нет — позиция не найдена в каталоге'
      : money(perRub, perUsd);
  return (
    `${index + 1}. ${item.title ?? '—'}\n   OEM: ${item.oem || '—'}\n   ${item.url ?? ''}\n   ` +
    `${quantity} шт. × ${price}`
  );
}

export async function POST(request: Request) {
  let payload: {
    customer?: Record<string, string>;
    items?: CheckoutItem[];
    goodsUsd?: number;
    consent?: boolean;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Некорректный запрос' }, { status: 400 });
  }

  const { customer = {}, goodsUsd = 0, consent = false } = payload;
  // Тело запроса — не наш код: массив может оказаться не массивом.
  const items = (Array.isArray(payload.items) ? payload.items : []).slice(0, MAX_ITEMS);

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

  const rates = await getRates();

  let prices: Map<string, number>;
  try {
    prices = await getPricesKrwByCartId(items.map((item) => item.id ?? ''));
  } catch (error) {
    // Заявку из-за базы не теряем: она уйдёт без подтверждённых цен, и это будет видно.
    console.error('[/api/checkout] цены из каталога', error);
    prices = new Map();
  }

  const priced = priceItems(items, prices, rates);
  const verified = priced.filter((entry) => entry.rub !== null && entry.usd !== null);
  const unverified = priced.length - verified.length;

  // Итог складывается из округлённых цен строк — ровно как в корзине: покупатель
  // проверяет сумму глазами, и она обязана сойтись в обеих валютах.
  const totalRub = verified.reduce((sum, entry) => sum + entry.rub! * entry.quantity, 0);
  const totalUsd = verified.reduce((sum, entry) => sum + entry.usd! * entry.quantity, 0);

  // Присланная сумма в счёт не идёт, но расхождение с ней менеджеру знать надо.
  // Сверяем по доллару: это цена оферты, её покупатель и видел.
  const claimedUsd = num(goodsUsd);
  const mismatch = unverified === 0 && Math.round(claimedUsd) !== Math.round(totalUsd);

  const orderNumber = `KP-${Date.now().toString().slice(-6)}`;

  /*
   * Мессенджер приходит выбором («как вам ответить»), а не наличием ника: покупатель
   * из-за рубежа чаще на WhatsApp, и прежнее поле с одним «@username» молча
   * предполагало Telegram.
   */
  const messenger = customer.messenger === 'telegram' ? 'telegram' : 'whatsapp';
  const tgUsername = customer.tgUsername?.trim() || null;

  const itemLines = priced.slice(0, MAX_ITEMS_IN_MESSAGE).map(itemLine);
  const rest = priced.length - MAX_ITEMS_IN_MESSAGE;

  const warnings = [
    mismatch &&
      `⚠️ В браузере показано ${formatUsd(Math.round(claimedUsd))} — сумма не сходится, счёт выставлять по расчёту выше.`,
    unverified > 0 &&
      `⚠️ Позиций без цены: ${unverified}. Их нет в каталоге по присланному ключу — проверить вручную.`,
  ].filter(Boolean) as string[];

  try {
    const { ok } = await submitLead({
      source: 'shop-checkout',
      title: `🛒 Новая заявка ${orderNumber}`,
      name: customer.name.trim(),
      phone: customer.phone.trim(),
      vin: customer.vin || null,
      messenger,
      tgUsername,
      message: [
        `Заявка ${orderNumber} из каталога запчастей`,
        `Страна доставки: ${customer.country || '—'}`,
        `Итого за детали: ${money(totalRub, totalUsd)}`,
        ...priced.map(
          (entry) => `• ${entry.item.title ?? '—'} — OEM ${entry.item.oem || '—'}, ${entry.quantity} шт.`,
        ),
        ...warnings,
      ]
        .filter(Boolean)
        .join('\n'),
      lines: [
        `👤 Клиент: ${customer.name.trim()}`,
        `📞 Телефон: ${customer.phone.trim()}`,
        `💬 Отвечать в: ${messenger === 'telegram' ? 'Telegram' : 'WhatsApp'}`,
        tgUsername && `✈️ Telegram: ${tgUsername}`,
        ...messengerLines({ phone: customer.phone, messenger, tgUsername: tgUsername ?? undefined }),
        `🌍 Страна доставки: ${customer.country || '—'}`,
        customer.vin && `🚗 VIN: ${customer.vin}`,
        '',
        '📦 Товары:',
        ...itemLines,
        rest > 0 && `…и ещё ${rest} позиций — уточните у клиента`,
        '',
        `💰 Итого за детали: ${money(totalRub, totalUsd)}`,
        '🚚 Доставка: рассчитать по стране получателя',
        ...warnings,
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
