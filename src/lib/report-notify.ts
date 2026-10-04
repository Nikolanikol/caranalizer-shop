import 'server-only';
import { BLANK, send } from '@/lib/telegram';
import { messengerLines } from '@/lib/messenger-links';
import { describePayPalError, paypalConfigLines, PayPalApiError } from '@/lib/paypal';
import type { ParseResult } from '@/lib/report-lead';

/**
 * Уведомления о попытках оплаты полного отчёта — в рабочий чат.
 *
 * Повод — 04.10.2026: месяц с лишним оплата отвечала ошибкой (`401 invalid_client`
 * от PayPal), минимум двое пытались заплатить и не смогли, а мы узнали об этом
 * случайно, от скриншота. Сервер всё это время знал — и писал только в лог.
 * Та же слепота, что у почтовых регистраций летом (см. `lib/auth/signup-notify.ts`),
 * и закрывается так же: сообщение в момент **начала**, а не только успеха.
 *
 * Два сообщения:
 * - `💳 Начал оплату отчёта` — человек нажал кнопку, заказ PayPal создан. Телефон
 *   и VIN в нём есть, поэтому если следом не придёт «оплачено», менеджер может написать
 *   сам. Это и есть спасённая заявка.
 * - `⚠️ Оплата отчёта сломалась` — с причиной и настройкой сервера. Приходит сразу,
 *   с первого же покупателя, а не через месяц.
 *
 * Только `TELEGRAM_WORK_CHAT_ID`: второй чат общий с kmotors, и попытки оплаты
 * их менеджерам — шум. Оплаченная заявка по-прежнему уходит в оба чата через `submitLead`.
 */
const CHATS = ['TELEGRAM_WORK_CHAT_ID'] as const;

/**
 * Роуты оплаты открыты без входа, и тело запроса пишет кто угодно. Чтобы их нельзя
 * было превратить в рассылку по рабочему чату, у сообщений общий потолок в час.
 * Настоящий поток — единицы в день; упёрлись — значит, кто-то дёргает роут, и об этом
 * говорится одной строкой в логе, а не сотней сообщений.
 *
 * В памяти процесса, как и `processedOrders` в роуте захвата: сайт — один
 * долгоживущий Node-процесс. Рестарт обнуляет счётчик, и это допустимо.
 */
const MAX_PER_HOUR = 30;
const HOUR = 60 * 60 * 1000;
let sentTimes: number[] = [];
let capLogged = false;

function underCap(): boolean {
  const now = Date.now();
  sentTimes = sentTimes.filter((t) => now - t < HOUR);
  if (sentTimes.length >= MAX_PER_HOUR) {
    if (!capLogged) {
      capLogged = true;
      console.error(`[report-notify] больше ${MAX_PER_HOUR} сообщений за час — остальные не шлём`);
    }
    return false;
  }
  capLogged = false;
  sentTimes.push(now);
  return true;
}

/**
 * Повторный клик того же человека — новый заказ PayPal, но не новая попытка.
 * Без этого закрытое и заново открытое окно оплаты давало бы по сообщению на каждый раз.
 */
const STARTED_DEDUPE_MS = 30 * 60 * 1000;
const startedRecently = new Map<string, number>();

function seenRecently(key: string): boolean {
  const now = Date.now();
  for (const [k, t] of startedRecently) if (now - t > STARTED_DEDUPE_MS) startedRecently.delete(k);
  if (startedRecently.has(key)) return true;
  startedRecently.set(key, now);
  return false;
}

/** Уведомление — побочный эффект: оплата не должна падать из-за Telegram. */
async function quietly(title: string, lines: (string | null | false | undefined)[]): Promise<void> {
  if (!underCap()) return;
  try {
    await send({ chats: CHATS, title, lines });
  } catch (error) {
    console.error('[report-notify] уведомление не ушло:', error);
  }
}

/**
 * Контакты из формы. Тело запроса — утверждение постороннего, поэтому в сообщение
 * идёт только то, что прошло `parseReportLead`; негодное подписывается, а не выдумывается.
 */
function contactLines(lead: ParseResult | null): (string | null | false)[] {
  if (!lead) return ['Контакты: форма не прислала данных'];
  if (!lead.ok) return [`Контакты: форма прислала негодные данные (${lead.error})`];
  const { phone, link, vin, messenger, tgUsername, comment } = lead.data;
  return [
    `📞 Телефон: ${phone}`,
    ...messengerLines({ phone, messenger, tgUsername }),
    vin ? `🚗 VIN: ${vin}` : `🌐 Объявление: ${link}`,
    comment ? `📝 Комментарий: ${comment}` : null,
  ];
}

/** Нажал «оплатить», заказ PayPal создан. */
export async function notifyPaymentStarted(
  lead: ParseResult | null,
  orderId: string,
  fundingSource: string | null
): Promise<void> {
  const key = lead?.ok ? `${lead.data.phone}|${lead.data.link}` : `order:${orderId}`;
  if (seenRecently(key)) return;

  await quietly('💳 Начал оплату отчёта', [
    ...contactLines(lead),
    fundingSource && `Способ: ${fundingSource === 'card' ? 'карта' : fundingSource}`,
    `Заказ PayPal: ${orderId}`,
    BLANK,
    'Если в течение получаса не придёт «Заявка на полный отчёт — оплачено»,',
    'человек бросил оплату или упёрся в ошибку — напишите ему сами.',
  ]);
}

export type PaymentFailureStage = 'create' | 'capture';

/**
 * Оплата сломалась на нашей стороне или у PayPal. Настройка сервера идёт в сообщение
 * всегда, когда PayPal отверг ключи: по ней причина видна без доступа к серверу.
 */
export async function notifyPaymentFailed(
  stage: PaymentFailureStage,
  error: unknown,
  lead: ParseResult | null,
  orderId?: string
): Promise<void> {
  const authProblem =
    (error instanceof PayPalApiError && error.status === 401) ||
    (error instanceof Error && error.message.startsWith('PayPal не настроен'));

  await quietly(
    stage === 'create' ? '⚠️ Оплата отчёта НЕ открылась' : '⚠️ Оплата отчёта НЕ подтвердилась',
    [
      `Причина: ${describePayPalError(error)}`,
      orderId && `Заказ PayPal: ${orderId}`,
      BLANK,
      ...contactLines(lead),
      BLANK,
      stage === 'create'
        ? 'Человек нажал «оплатить» и увидел ошибку — денег не списано. Напишите ему сами.'
        : 'Окно PayPal он прошёл, но платёж не захвачен. Проверьте заказ в панели PayPal,' +
          ' прежде чем писать: деньги могли и не списаться.',
      ...(authProblem ? [BLANK, ...paypalConfigLines()] : []),
    ]
  );
}
