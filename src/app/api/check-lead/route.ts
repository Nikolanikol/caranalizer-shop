import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { messengerLines } from "@/lib/messenger-links";

interface CheckLeadPayload {
  name: string;
  phone: string;
  link: string; // ссылка на объявление (Encar/KBChachacha/Kcar) или VIN
  messenger: string; // whatsapp | telegram
  tgUsername?: string;
  comment?: string;
  source?: string; // check (бесплатная проверка) | report (полный отчёт по VIN)
}

const SOURCES: Record<string, { page: string; title: string }> = {
  check: { page: "check", title: "🔎 CARANALIZER — бесплатная проверка" },
  report: { page: "report", title: "📄 CARANALIZER — заявка на полный отчёт по VIN" },
};

const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/i;
const LISTING_RE = /^(https?:\/\/)?([a-z0-9-]+\.)*(encar\.com|kbchachacha\.com|kcar\.com)\//i;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckLeadPayload;
    const { name, phone, link, messenger, tgUsername, comment } = body;
    // source приходит от клиента — берём только из белого списка
    const src = SOURCES[body.source ?? "check"] ?? SOURCES.check;

    if (!name?.trim() || !phone?.trim() || !link?.trim()) {
      return NextResponse.json({ error: "Name, phone and link required" }, { status: 400 });
    }
    const trimmedLink = link.trim();
    const isVin = VIN_RE.test(trimmedLink);
    if (!isVin && !LISTING_RE.test(trimmedLink)) {
      return NextResponse.json({ error: "Invalid link or VIN" }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
    const workChatId = process.env.TELEGRAM_WORK_CHAT_ID?.trim();
    if (!botToken || !chatId) {
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }

    const contactLines = messengerLines({ phone, messenger, tgUsername });

    const text = `${src.title}

👤 Имя: ${name}
📞 Телефон: ${phone}
${contactLines.join("\n")}
${isVin ? `🚗 VIN: ${trimmedLink.toUpperCase()}` : `🌐 Объявление: ${trimmedLink}`}${comment?.trim() ? `\n📝 Комментарий: ${comment.trim()}` : ""}`;

    const chatIds = [chatId, workChatId].filter(Boolean) as string[];
    const tgResults = await Promise.allSettled(
      chatIds.map((id) =>
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: id, text }),
        }).then((r) => r.json())
      )
    );

    const primaryResult = tgResults[0];
    const primaryOk = primaryResult.status === "fulfilled" && primaryResult.value?.ok;
    if (!primaryOk) {
      console.error("Telegram primary chat error:", primaryResult);
      return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    }

    try {
      await createServerClient().from("leads").insert({
        name,
        phone,
        vin: isVin ? trimmedLink.toUpperCase() : null,
        message: [isVin ? null : trimmedLink, comment?.trim() || null]
          .filter(Boolean)
          .join("\n"),
        messenger,
        tg_username: messenger === "telegram" ? tgUsername?.trim() || null : null,
        source_page: src.page,
        site: "caranalizer",
      });
    } catch (err) {
      console.error("leads insert failed:", err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/check-lead]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
