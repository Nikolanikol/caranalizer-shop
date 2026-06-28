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

function mask(val: string | undefined): string {
  if (!val) return "(empty)";
  if (val.length <= 6) return val;
  return val.slice(0, 3) + "***" + val.slice(-3);
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    const body = (await req.json()) as CheckoutPayload;
    const { items, phone, messenger, tgUsername, lang } = body;

    console.log("[checkout] === START ===");
    console.log("[checkout] payload:", JSON.stringify({ phone: mask(phone), messenger, tgUsername, lang, itemCount: items?.length }));

    if (!items?.length) {
      console.warn("[checkout] rejected: empty cart");
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (!phone) {
      console.warn("[checkout] rejected: no phone");
      return NextResponse.json({ error: "Phone required" }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
    const workChatId = process.env.TELEGRAM_WORK_CHAT_ID?.trim();

    console.log("[checkout] env check:", JSON.stringify({
      BOT_TOKEN: botToken ? `set (${botToken.length} chars)` : "MISSING",
      CHAT_ID: chatId ? `set: ${mask(chatId)}` : "MISSING",
      WORK_CHAT_ID: workChatId ? `set: ${mask(workChatId)}` : "MISSING",
    }));

    if (!botToken || !chatId) {
      console.error("[checkout] FATAL: missing required env vars");
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
    console.log(`[checkout] sending to ${chatIds.length} chat(s):`, chatIds.map(mask));

    const tgResults = await Promise.allSettled(
      chatIds.map(async (id, i) => {
        const t1 = Date.now();
        try {
          const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: id, text }),
          });
          const data = await res.json();
          console.log(`[checkout] TG[${i}] chat=${mask(id)} status=${res.status} ok=${data.ok} time=${Date.now() - t1}ms${data.ok ? "" : " error=" + JSON.stringify(data)}`);
          return data;
        } catch (fetchErr) {
          console.error(`[checkout] TG[${i}] chat=${mask(id)} FETCH FAILED time=${Date.now() - t1}ms:`, fetchErr);
          throw fetchErr;
        }
      })
    );

    const firstResult = tgResults[0];
    const firstOk = firstResult.status === "fulfilled" && firstResult.value?.ok;

    console.log("[checkout] TG results summary:", tgResults.map((r, i) => ({
      chat: mask(chatIds[i]),
      status: r.status,
      ok: r.status === "fulfilled" ? r.value?.ok : false,
      error: r.status === "rejected" ? String(r.reason) : (r.status === "fulfilled" && !r.value?.ok ? r.value?.description : undefined),
    })));

    if (!firstOk) {
      console.error("[checkout] primary chat failed, returning 500");
      return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
    }

    try {
      const t2 = Date.now();
      await createServerClient().from("leads").insert({
        name: phone,
        phone,
        tg_username: tgUsername || null,
        message: `Заказ: ${items.length} поз., ${formatKrw(totalKrw)}`,
        source_page: "checkout",
        messenger: messenger || null,
      });
      console.log(`[checkout] Supabase insert OK time=${Date.now() - t2}ms`);
    } catch (err) {
      console.error("[checkout] Supabase insert FAILED:", err);
    }

    console.log(`[checkout] === DONE total=${Date.now() - t0}ms ===`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`[checkout] UNHANDLED ERROR total=${Date.now() - t0}ms:`, err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
