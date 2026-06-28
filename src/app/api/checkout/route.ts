import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { formatKrw } from "@/lib/pricing";

interface CheckoutItem {
  partNumber: string;
  nameRu: string;
  nameEn: string;
  priceKrw: number;
  quantity: number;
}

interface CheckoutPayload {
  items: CheckoutItem[];
  phone: string;
  messenger: string;
  tgUsername?: string;
  lang?: string;
}

function formatWaLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutPayload;
    const { items, phone, messenger, tgUsername, lang } = body;

    if (!items?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: "Phone required" }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
    const workChatId = process.env.TELEGRAM_WORK_CHAT_ID?.trim();

    if (!botToken || !chatId) {
      console.error("[checkout] missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }

    const totalKrw = items.reduce((s, i) => s + i.priceKrw * i.quantity, 0);

    const itemLines = items
      .map((i) => `  • ${i.partNumber} — ${i.nameRu}\n    × ${i.quantity} = ${formatKrw(i.priceKrw * i.quantity)}`)
      .join("\n");

    const messengerLine = (() => {
      if (messenger === "whatsapp") {
        return `\n📱 Мессенджер: 💚 WhatsApp\n🔗 ${formatWaLink(phone)}`;
      }
      if (messenger === "telegram") {
        const tgLink = tgUsername
          ? `\n🔗 https://t.me/${tgUsername.replace(/^@/, "")}`
          : "";
        return `\n📱 Мессенджер: ✈️ Telegram${tgLink}`;
      }
      return "";
    })();

    const text = `🛒 Новый заказ — Caranalizer.com

📞 Телефон: ${phone}${messengerLine}
🌐 Язык: ${lang ?? "ru"}

📦 Товары (${items.length}):
${itemLines}

💰 Итого: ${formatKrw(totalKrw)}`;

    const chatIds = [chatId, workChatId].filter(Boolean) as string[];

    const tgResults = await Promise.allSettled(
      chatIds.map(async (id) => {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: id, text }),
        });
        return res.json();
      })
    );

    const firstResult = tgResults[0];
    const firstOk = firstResult.status === "fulfilled" && firstResult.value?.ok;

    if (!firstOk) {
      console.error("[checkout] Telegram send failed:", firstResult);
      return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
    }

    try {
      await createServerClient().from("leads").insert({
        name: phone,
        phone,
        tg_username: tgUsername || null,
        message: `Заказ: ${items.length} поз., ${formatKrw(totalKrw)}`,
        source_page: "checkout",
        messenger: messenger || null,
      });
    } catch (err) {
      console.error("[checkout] Supabase insert failed:", err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[checkout] unhandled error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
