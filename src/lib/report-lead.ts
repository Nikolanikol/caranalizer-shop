import 'server-only';
import { submitLead, type LeadResult } from '@/lib/leads';
import { messengerLines } from '@/lib/messenger-links';

/**
 * Разбор и сборка заявки на полный отчёт по VIN — общий код для маршрута оплаты
 * (`/api/paypal/capture-order`). Раньше эта заявка отправлялась без оплаты
 * из `/api/check-lead`; с 03.09.2026 заказ полного отчёта возможен только после
 * подтверждённого платежа, и роут без оплаты удалён — обходного пути к заявке
 * менеджеру больше нет.
 */

const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/i;
const LISTING_RE = /^(https?:\/\/)?([a-z0-9-]+\.)*(encar\.com|kbchachacha\.com|kcar\.com)\//i;

export interface ReportLeadPayload {
  name?: string;
  phone?: string;
  /** Ссылка на объявление Encar / KBChachacha / Kcar либо VIN. */
  link?: string;
  messenger?: string;
  tgUsername?: string;
  comment?: string;
}

interface ParsedReportLead {
  /** Форма его не спрашивает — приходит от PayPal. */
  name?: string;
  phone: string;
  link: string;
  vin: string | null;
  messenger?: string;
  tgUsername?: string;
  comment?: string;
}

export type ParseResult = { ok: true; data: ParsedReportLead } | { ok: false; error: string };

/**
 * Проверка полей до оплаты: если данные негодные, заказ PayPal не создаём и не
 * захватываем — деньги не должны списываться под заявку, которую всё равно
 * нельзя обработать.
 */
export function parseReportLead(body: ReportLeadPayload): ParseResult {
  const name = body.name?.trim();
  const phone = body.phone?.trim();
  const link = body.link?.trim();

  // Имени форма больше не спрашивает: его отдаёт PayPal вместе с почтой.
  // Обязательны номер (по нему менеджер пишет в мессенджер) и сам VIN.
  if (!phone || !link) {
    return { ok: false, error: 'Заполните телефон и VIN' };
  }

  const isVin = VIN_RE.test(link);
  if (!isVin && !LISTING_RE.test(link)) {
    return {
      ok: false,
      error: 'Нужна ссылка на Encar, KBChachacha или Kcar либо VIN из 17 знаков',
    };
  }

  return {
    ok: true,
    data: {
      name,
      phone,
      link,
      vin: isVin ? link.toUpperCase() : null,
      messenger: body.messenger?.trim(),
      tgUsername: body.tgUsername?.trim(),
      comment: body.comment?.trim(),
    },
  };
}

export async function submitReportLead(
  data: ParsedReportLead,
  payment: {
    orderId: string;
    amountUsd: number;
    payerEmail: string | null;
    payerName: string | null;
  }
): Promise<LeadResult> {
  const { phone, link, vin, messenger, tgUsername, comment } = data;

  /*
   * Имя берём у PayPal, а не у формы. Гостевая оплата картой может не отдать
   * ни имени, ни почты — тогда у менеджера остаются телефон, мессенджер и VIN,
   * и заявку всё равно можно обработать. Пустое место вместо имени в заголовке
   * читалось бы как поломка, поэтому подпись явная.
   */
  const name = data.name || payment.payerName || 'Покупатель PayPal';

  return submitLead({
    source: 'report',
    title: '📄 Заявка на полный отчёт по VIN — оплачено',
    name,
    phone,
    vin,
    messenger: messenger || null,
    tgUsername: messenger === 'telegram' ? tgUsername || null : null,
    // Почта в `leads` не пишется: таблица общая с kmotors, и колонки под неё там
    // нет. В сообщении менеджеру она есть — этого хватает, чтобы ответить письмом.
    message: [vin ? null : link, payment.payerEmail && `Почта: ${payment.payerEmail}`, comment || null]
      .filter(Boolean)
      .join('\n') || null,
    lines: [
      `👤 Имя: ${name}`,
      `📞 Телефон: ${phone}`,
      payment.payerEmail && `✉️ Почта: ${payment.payerEmail}`,
      ...messengerLines({ phone, messenger, tgUsername }),
      vin ? `🚗 VIN: ${vin}` : `🌐 Объявление: ${link}`,
      comment && `📝 Комментарий: ${comment}`,
      `💳 Оплата: PayPal $${payment.amountUsd.toFixed(2)}, заказ ${payment.orderId}`,
    ],
  });
}
