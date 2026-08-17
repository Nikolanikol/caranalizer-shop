import { NextRequest, NextResponse } from "next/server";
import { submitLead, type LeadSource } from "@/lib/leads";
import { messengerLines } from "@/lib/messenger-links";

/**
 * Заявка со страницы проверки по VIN. Роут разбирает тело и валидирует —
 * отправка и запись живут в `lib/leads`, одни на все три формы сайта.
 *
 * `source` остаётся двузначным: страницы бесплатной проверки и полного отчёта склеены
 * в одну, но воронка раздельная — иначе стало бы не видно, за чем именно приходят.
 */

interface CheckLeadPayload {
  name?: string;
  phone?: string;
  /** Ссылка на объявление Encar / KBChachacha / Kcar либо VIN. */
  link?: string;
  messenger?: string;
  tgUsername?: string;
  comment?: string;
  source?: string;
}

const TITLES: Record<Extract<LeadSource, "check" | "report">, string> = {
  check: "🔎 CARANALIZER — бесплатная проверка",
  report: "📄 CARANALIZER — заявка на полный отчёт по VIN",
};

const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/i;
const LISTING_RE = /^(https?:\/\/)?([a-z0-9-]+\.)*(encar\.com|kbchachacha\.com|kcar\.com)\//i;

export async function POST(req: NextRequest) {
  let body: CheckLeadPayload;
  try {
    body = (await req.json()) as CheckLeadPayload;
  } catch {
    return NextResponse.json({ success: false, error: "Некорректный запрос" }, { status: 400 });
  }

  const name = body.name?.trim();
  const phone = body.phone?.trim();
  const link = body.link?.trim();

  if (!name || !phone || !link) {
    return NextResponse.json(
      { success: false, error: "Заполните имя, телефон и ссылку или VIN" },
      { status: 400 }
    );
  }

  const isVin = VIN_RE.test(link);
  if (!isVin && !LISTING_RE.test(link)) {
    return NextResponse.json(
      { success: false, error: "Нужна ссылка на Encar, KBChachacha или Kcar либо VIN из 17 знаков" },
      { status: 400 }
    );
  }

  // Приходит от клиента, поэтому только из белого списка.
  const source: "check" | "report" = body.source === "report" ? "report" : "check";
  const messenger = body.messenger?.trim();
  const tgUsername = body.tgUsername?.trim();
  const comment = body.comment?.trim();
  const vin = isVin ? link.toUpperCase() : null;

  try {
    const { ok } = await submitLead({
      source,
      title: TITLES[source],
      name,
      phone,
      vin,
      messenger: messenger || null,
      tgUsername: messenger === "telegram" ? tgUsername || null : null,
      message: [isVin ? null : link, comment || null].filter(Boolean).join("\n") || null,
      lines: [
        `👤 Имя: ${name}`,
        `📞 Телефон: ${phone}`,
        ...messengerLines({ phone, messenger, tgUsername }),
        vin ? `🚗 VIN: ${vin}` : `🌐 Объявление: ${link}`,
        comment && `📝 Комментарий: ${comment}`,
      ],
    });

    if (!ok) {
      return NextResponse.json({ success: false, error: "Не удалось отправить заявку" }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/check-lead]", error);
    return NextResponse.json({ success: false, error: "Ошибка сервера" }, { status: 500 });
  }
}
