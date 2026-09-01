import 'server-only';
import { createServerClient } from '@/lib/supabase';
import { send } from '@/lib/telegram';

/**
 * Единственный путь заявки: Telegram в оба чата плюс запись в таблицу `leads`.
 *
 * До этого каждый из трёх роутов делал всё сам, и контракты разошлись. Самое дорогое
 * расхождение: `/api/checkout` требовал `TELEGRAM_WORK_CHAT_ID` и не читал
 * `TELEGRAM_CHAT_ID`, а два других — наоборот. На окружении, настроенном под исходный
 * caranalizer, оформление заказа отвечало 503 на каждую попытку, а формы проверки при
 * этом работали — отказ выглядел как «магазин почему-то не работает». Разошлись и коды
 * ошибок (500/502/503), и форма ответа, и экранирование: HTML экранировал только один
 * из трёх, то есть имя с «<» ломало отправку.
 */

/** Откуда пришла заявка. Union, а не строка: раньше значения набирались по памяти. */
export type LeadSource = 'check' | 'report' | 'contact' | 'shop-checkout';

/**
 * Заявка идёт в оба чата одновременно, и обе переменные поэтому обязательны.
 *
 * Уведомления о регистрации, в отличие от заявок, уходят только в рабочий чат —
 * см. `lib/auth/signup-notify.ts`. Списки разные намеренно: заявку должны видеть все,
 * кто их обрабатывает, а регистрация — событие одной площадки.
 */
const CHATS = ['TELEGRAM_CHAT_ID', 'TELEGRAM_WORK_CHAT_ID'] as const;

export interface LeadRecord {
  name: string;
  phone: string;
  vin?: string | null;
  message?: string | null;
  messenger?: string | null;
  tgUsername?: string | null;
}

export interface LeadInput extends LeadRecord {
  source: LeadSource;
  /**
   * Первая строка сообщения. Уже с эмодзи, без экранирования — его сделает транспорт.
   * Метку площадки сюда не дописывать: её ставит `lib/telegram.ts` сам, иначе она
   * задвоится.
   */
  title: string;
  /**
   * Тело сообщения строками. Пустые и `null` отбрасываются, поэтому необязательные
   * поля можно передавать выражением без ветвления на стороне роута.
   *
   * Строки экранируются целиком, поэтому разметку сюда не кладут: жирный заголовок
   * добавляет модуль, а внутри значений `<` и `>` — это данные от клиента.
   */
  lines: (string | null | false | undefined)[];
}

export interface LeadResult {
  /** Доставлено хотя бы в один чат. */
  ok: boolean;
  /** Сколько чатов приняли сообщение — 2 при штатной работе. */
  delivered: number;
}

/**
 * Отправить заявку.
 *
 * Доставка, экранирование, обрезка и метка площадки — в `lib/telegram.ts`: транспорт
 * общий с уведомлениями о регистрации. Здесь остаётся то, что отличает заявку от
 * прочих сообщений: оба чата и строка в `leads`.
 *
 * Успехом считаем доставку **хотя бы в один** чат: недостающие переменные транспорт
 * уже отсёк, поэтому отказ на этом этапе — временная проблема Telegram, а не настройка.
 * Терять клиента из-за неё хуже, чем принять заявку, которую увидел один менеджер
 * вместо двух.
 *
 * Запись в базу идёт после Telegram и в своём try: заявка уже у менеджера, и падение
 * записи в воронку не повод показывать клиенту ошибку.
 */
export async function submitLead(input: LeadInput): Promise<LeadResult> {
  const { ok, delivered } = await send({
    chats: CHATS,
    title: input.title,
    lines: input.lines,
  });

  await store(input);

  return { ok, delivered };
}

async function store(input: LeadInput): Promise<void> {
  try {
    await createServerClient().from('leads').insert({
      name: input.name,
      phone: input.phone,
      vin: input.vin?.trim() || null,
      message: input.message || null,
      messenger: input.messenger || null,
      tg_username: input.tgUsername?.trim() || null,
      source_page: input.source,
      site: 'caranalizer',
    });
  } catch (error) {
    console.error('Заявка не записалась в leads:', error);
  }
}
