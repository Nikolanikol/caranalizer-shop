import { NextResponse } from "next/server";
import { createReportOrder } from "@/lib/paypal";
import { parseReportLead, type ParseResult, type ReportLeadPayload } from "@/lib/report-lead";
import { notifyPaymentFailed, notifyPaymentStarted } from "@/lib/report-notify";

/**
 * Первый шаг оплаты полного отчёта: завести заказ PayPal на фиксированную сумму.
 * Сумма берётся из константы на сервере — тело запроса её не несёт, подделать нечем.
 *
 * Тело несёт контакты из формы, и только ради уведомления в рабочий чат: человек нажал
 * «оплатить» — значит, телефон и VIN у менеджера должны появиться уже сейчас, даже если
 * до оплаты он не дойдёт. На заказ они не влияют: негодное или пустое тело заказ
 * не отменяет — платёжную кнопку из-за уведомления ломать нельзя.
 */

interface CreateBody extends ReportLeadPayload {
  fundingSource?: string;
}

/** Способ оплаты из виджета. Короткий закрытый набор — остальное не наше дело. */
function fundingOf(value: unknown): string | null {
  return typeof value === "string" && /^[a-z]{2,20}$/.test(value) ? value : null;
}

export async function POST(req: Request) {
  let body: CreateBody | null = null;
  try {
    const parsed: unknown = await req.json();
    if (parsed && typeof parsed === "object") body = parsed as CreateBody;
  } catch {
    // старый клиент без тела или мусор — заказ всё равно создаём
  }
  const lead: ParseResult | null = body ? parseReportLead(body) : null;

  let id: string;
  try {
    id = await createReportOrder();
  } catch (error) {
    console.error("[/api/paypal/create-order]", error);
    await notifyPaymentFailed("create", error, lead);
    // 500, а не 502: на 502 от сервера Cloudflare подменяет тело своей страницей,
    // и в браузере вместо нашего ответа виден «error code: 502».
    return NextResponse.json({ error: "Не удалось создать платёж" }, { status: 500 });
  }

  await notifyPaymentStarted(lead, id, fundingOf(body?.fundingSource));
  return NextResponse.json({ id });
}
