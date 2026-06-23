import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

interface ContactPayload {
  name: string;
  phone: string;
  message?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContactPayload;
    const { name, phone, message } = body;

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "Name and phone required" }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) {
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }

    const text = `📬 Обратная связь — Caranalizer.com

👤 Имя: ${name}
📞 Телефон: ${phone}${message ? `\n💬 Сообщение: ${message}` : ""}`;

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const tgData = await tgRes.json();

    if (!tgData.ok) {
      console.error("Telegram error:", tgData);
      return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    }

    try {
      await createServerClient().from("leads").insert({
        name,
        phone,
        message: message ?? null,
        source_page: "contact",
      });
    } catch (err) {
      console.error("leads insert failed:", err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/contact]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
