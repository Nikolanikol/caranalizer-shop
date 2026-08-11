/**
 * Кликабельные ссылки на мессенджеры для уведомлений в Telegram:
 * менеджер открывает чат с клиентом в один тап, без копирования номера.
 */

/** Телефон в вид, пригодный для wa.me / t.me: только цифры. */
function digits(value: string | undefined | null): string {
  return (value ?? "").replace(/\D/g, "");
}

/** Международный номер: 8–15 цифр (E.164 допускает максимум 15). */
function isPhone(value: string): boolean {
  return value.length >= 8 && value.length <= 15;
}

/** https://wa.me/<номер> — null, если телефон не похож на международный. */
export function whatsappLink(phone: string | undefined | null): string | null {
  const num = digits(phone);
  return isPhone(num) ? `https://wa.me/${num}` : null;
}

export interface TelegramContact {
  /** Готовая ссылка на чат или null, если ни username, ни телефон не подошли. */
  url: string | null;
  /** Что именно ввёл клиент (@username или id) — если это не просто телефон. */
  handle: string | null;
}

const TG_USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/;

/**
 * Ссылка на Telegram-чат: по username, если он валидный,
 * иначе по номеру телефона (t.me/+<номер> — официальный deep link).
 * Числовой user id в t.me не резолвится, поэтому он идёт в handle,
 * а ссылка строится по телефону.
 */
export function telegramLink(
  tgUsername: string | undefined | null,
  phone?: string | null
): TelegramContact {
  const raw = (tgUsername ?? "").trim();
  const cleaned = raw
    .replace(/^(https?:\/\/)?(www\.)?t(elegram)?\.me\//i, "")
    .replace(/^@/, "")
    .trim();

  const phoneUrl = isPhone(digits(phone)) ? `https://t.me/+${digits(phone)}` : null;

  if (!cleaned) return { url: phoneUrl, handle: null };

  if (TG_USERNAME_RE.test(cleaned)) {
    return { url: `https://t.me/${cleaned}`, handle: `@${cleaned}` };
  }

  // Ввели номер телефона вместо username
  const cleanedDigits = digits(cleaned);
  if (/^\+?\d+$/.test(cleaned) && isPhone(cleanedDigits) && cleaned.startsWith("+")) {
    return { url: `https://t.me/+${cleanedDigits}`, handle: null };
  }

  // Числовой id или мусор: ссылку строим по телефону, ввод показываем как есть
  return { url: phoneUrl, handle: raw };
}

/**
 * Блок строк «мессенджер + ссылка» для сообщения в Telegram.
 * Ссылка одна — на тот мессенджер, который выбрал клиент.
 * Если форма без выбора (обратная связь) — даём обе.
 */
export function messengerLines(opts: {
  phone: string;
  messenger?: string;
  tgUsername?: string;
}): string[] {
  const { phone, messenger, tgUsername } = opts;
  const wa = whatsappLink(phone);
  const tg = telegramLink(tgUsername, phone);

  if (!messenger) {
    // Форма без выбора мессенджера — даём обе ссылки равноправно
    return [wa && `💚 WhatsApp: ${wa}`, tg.url && `💙 Telegram: ${tg.url}`].filter(
      Boolean
    ) as string[];
  }

  const preferTelegram = messenger === "telegram";
  const chosen = preferTelegram
    ? { label: "💙 Telegram", url: tg.url }
    : { label: "💚 WhatsApp", url: wa };
  const fallback = preferTelegram
    ? { label: "💚 WhatsApp", url: wa }
    : { label: "💙 Telegram", url: tg.url };

  const lines = [
    `📱 Мессенджер: ${chosen.label}${preferTelegram && tg.handle ? ` — ${tg.handle}` : ""}`,
  ];

  if (chosen.url) {
    lines.push(`🔗 ${chosen.url}`);
  } else if (fallback.url) {
    // Выбранный мессенджер собрать не из чего — чтобы менеджер не остался без ссылки
    lines.push(`🔗 ${fallback.label}: ${fallback.url}`);
  }

  return lines;
}
