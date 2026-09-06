import { NextResponse } from "next/server";
import { createReportOrder } from "@/lib/paypal";

/**
 * Первый шаг оплаты полного отчёта: завести заказ PayPal на фиксированную сумму.
 * Сумма берётся из константы на сервере — тело запроса её не несёт, подделать нечем.
 */
export async function POST() {
  try {
    const id = await createReportOrder();
    return NextResponse.json({ id });
  } catch (error) {
    console.error("[/api/paypal/create-order]", error);
    return NextResponse.json({ error: "Не удалось создать платёж" }, { status: 502 });
  }
}
