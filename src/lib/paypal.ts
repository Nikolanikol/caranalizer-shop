import 'server-only';

/**
 * Оплата полного отчёта по VIN. Цена фиксированная — один VIN, $6, пакетов нет
 * (решение владельца 03.09.2026: «одна цена за один VIN», а не тарифная сетка).
 *
 * Заказ создаётся на сервере с суммой из константы: сумма из браузера — утверждение
 * постороннего, её нельзя брать за основу счёта. Тот же принцип, что и в
 * `lib/shop/pricing.ts` у корзины.
 */
export const REPORT_PRICE_USD = 6;

const LIVE_BASE = 'https://api-m.paypal.com';
const SANDBOX_BASE = 'https://api-m.sandbox.paypal.com';

/**
 * Режим по умолчанию — песочница, и это осознанно: случайно не взять денег
 * дешевле, чем случайно взять. Но у умолчания есть цена — забытая на проде
 * `PAYPAL_API_BASE` не выглядит поломкой ВООБЩЕ: кнопка работает, оплата
 * «проходит», заявка приходит менеджеру, а деньги не приходят никуда.
 *
 * Поэтому режим печатается в лог один раз за жизнь процесса. Это единственное
 * место, где боевой режим можно подтвердить, не имея доступа к панели.
 */
let modeLogged = false;

function apiBase(): string {
  const base = process.env.PAYPAL_API_BASE?.trim() || SANDBOX_BASE;
  if (!modeLogged) {
    modeLogged = true;
    console.log(
      base === LIVE_BASE
        ? '[paypal] режим: БОЕВОЙ — платежи настоящие'
        : `[paypal] режим: ПЕСОЧНИЦА (${base}) — настоящих денег не будет. ` +
            `Для боевого задайте PAYPAL_API_BASE=${LIVE_BASE}`
    );
  }
  return base;
}

export class PayPalApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`PayPal API ответил ${status}`);
    this.status = status;
    this.body = body;
  }
}

function hasIssue(body: unknown, issue: string): boolean {
  if (!body || typeof body !== 'object') return false;
  const details = (body as { details?: unknown }).details;
  return Array.isArray(details) && details.some((d) => (d as { issue?: string })?.issue === issue);
}

function serverClientId(): string | undefined {
  return (process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID)?.trim() || undefined;
}

/**
 * Настройка PayPal так, как её видит сервер, — без секрета, только факты для разбора.
 *
 * Заведено после 04.10.2026: месяц оплата отчёта отвечала `401 invalid_client`, а в логе
 * было лишь «PayPal API ответил 401». Причин у такого ответа три — сервер ходит
 * в песочницу с боевым client id, секрет от другого приложения, или `PAYPAL_CLIENT_ID`
 * перекрывает `NEXT_PUBLIC_PAYPAL_CLIENT_ID` другим значением, — и различить их можно
 * только по этим полям. Client id публичен по замыслу PayPal, поэтому его начало
 * показывать можно; секрета здесь нет, есть только «задан / не задан».
 */
export interface PayPalConfig {
  mode: 'live' | 'sandbox';
  base: string;
  /** Какая переменная дала client id серверу. */
  clientIdFrom: 'PAYPAL_CLIENT_ID' | 'NEXT_PUBLIC_PAYPAL_CLIENT_ID' | null;
  clientIdHead: string | null;
  /** Совпадает ли client id сервера с тем, что вшит в кнопку браузера. */
  clientIdMatchesBrowser: boolean;
  hasSecret: boolean;
}

export function paypalConfig(): PayPalConfig {
  const base = apiBase();
  const server = serverClientId();
  const browser = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim();
  return {
    mode: base === LIVE_BASE ? 'live' : 'sandbox',
    base,
    clientIdFrom: process.env.PAYPAL_CLIENT_ID?.trim()
      ? 'PAYPAL_CLIENT_ID'
      : browser
        ? 'NEXT_PUBLIC_PAYPAL_CLIENT_ID'
        : null,
    clientIdHead: server ? `${server.slice(0, 8)}…` : null,
    clientIdMatchesBrowser: Boolean(server && browser && server === browser),
    hasSecret: Boolean(process.env.PAYPAL_CLIENT_SECRET?.trim()),
  };
}

/** Строки настройки для сообщения о сбое: по ним причина 401 видна без доступа к серверу. */
export function paypalConfigLines(): string[] {
  const c = paypalConfig();
  return [
    `Режим сервера: ${c.mode === 'live' ? 'боевой' : `ПЕСОЧНИЦА (${c.base})`}`,
    `Client id: ${c.clientIdHead ?? 'не задан'}${c.clientIdFrom ? ` из ${c.clientIdFrom}` : ''}`,
    `Совпадает с кнопкой на сайте: ${c.clientIdMatchesBrowser ? 'да' : 'НЕТ'}`,
    `Секрет задан: ${c.hasSecret ? 'да' : 'НЕТ'}`,
  ];
}

/**
 * Проверить, что PayPal выдаёт серверу токен, — то есть что ключи и режим сходятся.
 * Первое, что ломается при неверной настройке, и единственное, что можно проверить,
 * не создавая заказа.
 */
export async function checkPayPalAuth(): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    await getAccessToken();
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: describePayPalError(error) };
  }
}

/**
 * Причина сбоя одной строкой — для Telegram и для health. Тело ответа PayPal бывает
 * длинным, поэтому из него берётся код ошибки, а не всё подряд.
 */
export function describePayPalError(error: unknown): string {
  if (error instanceof PayPalApiError) {
    let body = error.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // не JSON — покажем как есть
      }
    }
    const b = (body && typeof body === 'object' ? body : {}) as {
      error?: string;
      name?: string;
      details?: { issue?: string }[];
    };
    const code = b.details?.[0]?.issue || b.error || b.name || (typeof body === 'string' ? body.slice(0, 200) : '');
    const hint =
      error.status === 401
        ? ' — PayPal не принял ключи: проверьте PAYPAL_API_BASE и что PAYPAL_CLIENT_SECRET от того же приложения'
        : '';
    return `PayPal ${error.status}${code ? ` ${code}` : ''}${hint}`;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Токен кешируется в памяти процесса — тот же приём, что у клиентов Supabase
 * в `lib/supabase.ts`: сайт живёт как один долгоживущий Node-процесс
 * (`output: standalone`), а не как отдельные serverless-вызовы.
 */
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) {
    return cachedToken.token;
  }

  /*
   * Client ID у PayPal один, а нужен он в двух местах: серверу — за токеном,
   * браузеру — для кнопки. Браузер видит только переменные с префиксом
   * `NEXT_PUBLIC_`, поэтому она обязательна; серверную читаем как запасную,
   * чтобы одно и то же значение не приходилось вписывать дважды и не ловить
   * молчаливый отказ из-за забытой половины.
   *
   * Открытость `NEXT_PUBLIC_` здесь не проблема: client id публичен по замыслу
   * PayPal — он и так стоит в адресе их скрипта на каждой странице с оплатой.
   * Секрет остаётся серверным и в браузер не попадает никогда.
   */
  const clientId = serverClientId();
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!clientId || !secret) {
    throw new Error(
      'PayPal не настроен: нужны NEXT_PUBLIC_PAYPAL_CLIENT_ID и PAYPAL_CLIENT_SECRET'
    );
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    throw new PayPalApiError(res.status, await res.text());
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: json.access_token, expiresAt: now + json.expires_in * 1000 };
  return cachedToken.token;
}

async function paypalRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new PayPalApiError(res.status, json);
  }
  return json as T;
}

/** Создать заказ на фиксированную сумму. Возвращает id заказа PayPal. */
export async function createReportOrder(): Promise<string> {
  const order = await paypalRequest<{ id: string }>('/v2/checkout/orders', {
    method: 'POST',
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          description: 'Полный отчёт по VIN — caranalizer.com',
          amount: { currency_code: 'USD', value: REPORT_PRICE_USD.toFixed(2) },
        },
      ],
    }),
  });
  return order.id;
}

export interface CapturedPayment {
  orderId: string;
  amountUsd: number;
  /**
   * Почта и имя плательщика от PayPal.
   *
   * Это единственное место во всём сайте, где почта покупателя появляется сама:
   * ни корзина, ни форма проверки, ни контакты её не спрашивают. Поэтому форма
   * оплаты имени больше не просит — его отдаёт PayPal. У гостевой оплаты картой
   * полей может не быть вовсе, отсюда `null` и запасной путь у вызывающего.
   */
  payerEmail: string | null;
  payerName: string | null;
}

interface PayPalOrder {
  status: string;
  payer?: {
    email_address?: string;
    name?: { given_name?: string; surname?: string };
  };
  purchase_units?: {
    payments?: { captures?: { amount?: { value?: string; currency_code?: string } }[] };
  }[];
}

/**
 * Захватить платёж и проверить сумму. Заказ может быть уже захвачен тем же
 * запросом-повтором (двойной клик, ретрай сети после обрыва ответа) — PayPal в этом
 * случае отвечает `ORDER_ALREADY_CAPTURED`, и вместо ошибки мы дочитываем состояние
 * заказа: деньги уже списаны, второй раз списывать нечего, а заявку по нему
 * обязаны обработать так же, как при первом успехе.
 */
export async function captureReportOrder(orderId: string): Promise<CapturedPayment> {
  let order: PayPalOrder;
  try {
    order = await paypalRequest<PayPalOrder>(`/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
    });
  } catch (error) {
    if (error instanceof PayPalApiError && hasIssue(error.body, 'ORDER_ALREADY_CAPTURED')) {
      order = await paypalRequest<PayPalOrder>(`/v2/checkout/orders/${orderId}`, { method: 'GET' });
    } else {
      throw error;
    }
  }

  if (order.status !== 'COMPLETED') {
    throw new Error(`Оплата не завершена: статус заказа ${order.status}`);
  }

  const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
  const amount = Number(capture?.amount?.value);
  const currency = capture?.amount?.currency_code;

  if (currency !== 'USD' || amount !== REPORT_PRICE_USD) {
    throw new Error(`Сумма платежа не совпадает с ожидаемой: ${amount} ${currency}`);
  }

  const payerName = [order.payer?.name?.given_name, order.payer?.name?.surname]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    orderId,
    amountUsd: amount,
    payerEmail: order.payer?.email_address?.trim() || null,
    payerName: payerName || null,
  };
}
