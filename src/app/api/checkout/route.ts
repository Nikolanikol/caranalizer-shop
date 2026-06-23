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
  contactMethod: "phone" | "telegram" | "none";
  contactValue?: string;
  lang?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutPayload;
    const { items, contactMethod, contactValue, lang } = body;

    if (!items?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (contactMethod !== "none" && !contactValue?.trim()) {
      return NextResponse.json({ error: "Contact info required" }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) {
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }

    const totalKrw = items.reduce((s, i) => s + i.priceKrw * i.quantity, 0);

    const itemLines = items
      .map((i) => `  • ${i.partNumber} — ${i.nameRu}\n    × ${i.quantity} = ${formatKrw(i.priceKrw * i.quantity)}`)
      .join("\n");

    const contactLine = (() => {
      if (contactMethod === "phone") return `📞 Телефон: ${contactValue}`;
      if (contactMethod === "telegram") return `✈️ Telegram: ${contactValue}`;
      return "❌ Контакт не указан (клиент выбрал «нет контакта»)";
    })();

    const text = `🛒 Новый заказ — Caranalizer.com

${contactLine}
🌐 Язык: ${lang ?? "ru"}

📦 Товары (${items.length}):
${itemLines}

💰 Итого: ${formatKrw(totalKrw)}`;

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const tgData = await tgRes.json();

    if (!tgData.ok) {
      console.error("Telegram error:", tgData);
      return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
    }

    try {
      await createServerClient().from("leads").insert({
        name: contactValue?.trim() || "no-contact",
        phone: contactMethod === "phone" ? contactValue : null,
        tg_username: contactMethod === "telegram" ? contactValue : null,
        message: `Заказ: ${items.length} поз., ${formatKrw(totalKrw)}`,
        source_page: "checkout",
        messenger: contactMethod === "none" ? null : contactMethod,
      });
    } catch (err) {
      console.error("leads insert failed:", err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/checkout]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
