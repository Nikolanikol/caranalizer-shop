import { NextRequest, NextResponse } from "next/server";
import { submitLead } from "@/lib/leads";
import { messengerLines } from "@/lib/messenger-links";

/**
 * Обратная связь. Роут только разбирает тело и проверяет обязательные поля —
 * отправка и запись живут в `lib/leads`, одни на все три формы сайта.
 */

interface ContactPayload {
  name?: string;
  phone?: string;
  message?: string;
}

export async function POST(req: NextRequest) {
  let body: ContactPayload;
  try {
    body = (await req.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ success: false, error: "Некорректный запрос" }, { status: 400 });
  }

  const name = body.name?.trim();
  const phone = body.phone?.trim();
  const message = body.message?.trim();

  if (!name || !phone) {
    return NextResponse.json({ success: false, error: "Заполните имя и телефон" }, { status: 400 });
  }

  try {
    const { ok } = await submitLead({
      source: "contact",
      title: "📬 CARANALIZER — обратная связь",
      name,
      phone,
      message: message || null,
      lines: [
        `👤 Имя: ${name}`,
        `📞 Телефон: ${phone}`,
        ...messengerLines({ phone }),
        message && `💬 Сообщение: ${message}`,
      ],
    });

    if (!ok) {
      return NextResponse.json({ success: false, error: "Не удалось отправить заявку" }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/contact]", error);
    return NextResponse.json({ success: false, error: "Ошибка сервера" }, { status: 500 });
  }
}
