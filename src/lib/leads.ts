import 'server-only';
import { createServerClient } from '@/lib/supabase';

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

/** Названия чатов — только для логов, чтобы было видно, какой именно не принял. */
const CHATS = ['TELEGRAM_CHAT_ID', 'TELEGRAM_WORK_CHAT_ID'] as const;

/**
 * Метка площадки в заголовке заявки.
 *
 * Чат общий с kmotors, и без метки заявки двух площадок неразличимы — менеджер
 * определял их по формулировкам. В базе такая метка была всегда (колонка `site`
 * в `leads`), а в Telegram её не было.
 *
 * Ставится здесь, а не в заголовках роутов, ровно по той причине, по которой заведён
 * этот модуль: три заголовка из четырёх метку носили руками, а самый ценный — заказ
 * из корзины — её не имел. Теперь новая форма получает метку тем, что пользуется
 * `submitLead`, и забыть её нельзя.
 *
 * Решётка не для красоты: Telegram делает хештег кликабельным, и по нему в общем
 * чате отбираются все наши заявки разом.
 */
const SITE_TAG = '#caranalizer';

/**
 * Проверка окружения на входе в модуль, а не внутри обработчика.
 *
 * «Падение при старте» в буквальном смысле для serverless невозможно — процесса,
 * который стартует один раз, там нет. Ближайшее к этому: упасть при первой загрузке
 * модуля с внятным сообщением, в котором названа недостающая переменная. Это заметно
 * сразу после деплоя и не даёт молча терять заявки.
 */
function requireEnv(): { token: string; chatIds: string[] } {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatIds = CHATS.map((name) => process.env[name]?.trim());

  const missing = [
    ...(token ? [] : ['TELEGRAM_BOT_TOKEN']),
    ...CHATS.filter((name, i) => !chatIds[i]),
  ];

  if (missing.length > 0) {
    throw new Error(
      `Приём заявок не настроен: не заданы ${missing.join(', ')}. ` +
        'Обе переменные с чатами обязательны — заявка уходит в оба одновременно.'
    );
  }

  return { token: token!, chatIds: chatIds as string[] };
}

/** Telegram разбирает HTML, поэтому пользовательский текст обязан быть экранирован. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Telegram режет сообщение на 4096 символах — обрезаем сами и говорим об этом честно. */
const MAX_MESSAGE = 3900;

function clamp(text: string): string {
  return text.length <= MAX_MESSAGE
    ? text
    : `${text.slice(0, MAX_MESSAGE)}\n\n…сообщение обрезано, детали у клиента`;
}

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
   * Первая строка сообщения. Уже с эмодзи, без экранирования — его сделает модуль.
   * Метку площадки сюда не дописывать: её ставит `submitLead` сам, иначе она
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
 * Отправка идёт в оба чата параллельно. Успехом считаем доставку **хотя бы в один**:
 * недостающие переменные уже отсечены `requireEnv`, поэтому отказ на этом этапе —
 * временная проблема Telegram, а не настройка. Терять клиента из-за неё хуже, чем
 * принять заявку, которую увидел один менеджер вместо двух. Каждый неудавшийся чат
 * пишется в лог по имени переменной.
 *
 * Запись в базу идёт после Telegram и в своём try: заявка уже у менеджера, и падение
 * записи в воронку не повод показывать клиенту ошибку.
 */
export async function submitLead(input: LeadInput): Promise<LeadResult> {
  const { token, chatIds } = requireEnv();

  const header = `${SITE_TAG} · ${input.title}`;
  const body = [`<b>${escapeHtml(header)}</b>`, '', ...input.lines.filter(Boolean).map(escapeHtml)];
  const text = clamp(body.join('\n'));

  const results = await Promise.allSettled(
    chatIds.map((chatId) =>
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      }).then((res) => res.json())
    )
  );

  let delivered = 0;
  results.forEach((result, i) => {
    const ok = result.status === 'fulfilled' && result.value?.ok;
    if (ok) delivered += 1;
    else console.error(`Заявка не ушла в ${CHATS[i]}:`, result.status === 'fulfilled' ? result.value : result.reason);
  });

  await store(input);

  return { ok: delivered > 0, delivered };
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
