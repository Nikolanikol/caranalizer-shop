import { NextResponse } from "next/server";
import { checkPayPalAuth, paypalConfig } from "@/lib/paypal";

/**
 * Работает ли оплата — одним запросом, без создания заказа.
 *
 * Открывать после каждого деплоя и правки переменных: месяц сломанной оплаты
 * (до 04.10.2026) был виден ровно этим запросом, а заметили его по скриншоту
 * покупателя. Годится и для внешнего монитора — 200 значит «ключи приняты»,
 * 503 — нет.
 *
 * Секрета ответ не раскрывает: только режим, начало публичного client id
 * и «задан / не задан».
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await checkPayPalAuth();
  const config = paypalConfig();
  return NextResponse.json(
    { ...auth, mode: config.mode, clientId: config.clientIdHead, clientIdFrom: config.clientIdFrom,
      clientIdMatchesBrowser: config.clientIdMatchesBrowser, hasSecret: config.hasSecret },
    { status: auth.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
