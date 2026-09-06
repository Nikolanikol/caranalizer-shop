import { NextRequest, NextResponse } from "next/server";
import { captureReportOrder } from "@/lib/paypal";
import { parseReportLead, submitReportLead, type ReportLeadPayload } from "@/lib/report-lead";

/**
 * Второй шаг оплаты: подтвердить платёж у PayPal и, только после этого, отправить
 * заявку менеджеру. Порядок обязателен — сперва проверяем данные формы (не списывать
 * деньги под заявку, которую всё равно нельзя обработать), потом захватываем платёж,
 * и лишь затем шлём заявку. `orderId` пришёл из PayPal-виджета в браузере, а не
 * придуман клиентом: сумму и статус мы всё равно перепроверяем у PayPal напрямую.
 */

interface CaptureBody extends ReportLeadPayload {
  orderId?: string;
}

/**
 * Заказы, которые уже дошли до заявки. Только в памяти процесса (сайт живёт как
 * один долгоживущий Node-процесс, не serverless) — переживает двойной клик и ретрай
 * сети в пределах одного запуска, не переживает рестарт. Пойманы не были; заведено
 * заранее, потому что дублирующаяся заявка по уже оплаченному заказу — это ровно то,
 * от чего эту оплату и заводили: не плодить лишние обращения к менеджеру.
 */
const processedOrders = new Set<string>();

export async function POST(req: NextRequest) {
  let body: CaptureBody;
  try {
    body = (await req.json()) as CaptureBody;
  } catch {
    return NextResponse.json({ success: false, error: "Некорректный запрос" }, { status: 400 });
  }

  const orderId = body.orderId?.trim();
  if (!orderId) {
    return NextResponse.json(
      { success: false, error: "Не передан идентификатор платежа" },
      { status: 400 }
    );
  }

  if (processedOrders.has(orderId)) {
    return NextResponse.json({ success: true });
  }

  const parsed = parseReportLead(body);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  }

  let payment;
  try {
    payment = await captureReportOrder(orderId);
  } catch (error) {
    console.error("[/api/paypal/capture-order] захват платежа не удался", orderId, error);
    return NextResponse.json({ success: false, error: "Оплата не подтвердилась" }, { status: 402 });
  }

  processedOrders.add(orderId);

  try {
    const result = await submitReportLead(parsed.data, payment);
    if (!result.ok) {
      console.error("[/api/paypal/capture-order] оплачено, но заявка не ушла ни в один чат", orderId);
    }
  } catch (error) {
    // Деньги уже списаны — отдаём успех, чтобы не пугать оплатившего человека
    // сообщением об ошибке, но громко пишем в лог: заявку по этому заказу нужно
    // поднять руками.
    console.error("[/api/paypal/capture-order] оплачено, но отправка заявки упала", orderId, error);
  }

  return NextResponse.json({ success: true });
}
