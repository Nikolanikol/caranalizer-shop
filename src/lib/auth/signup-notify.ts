import 'server-only';
import type { User } from '@supabase/supabase-js';
import { BLANK, send } from '@/lib/telegram';

/**
 * Уведомления о регистрации в Telegram.
 *
 * Повод измеримый, а не «хорошо бы знать». Замер 01.09.2026 по боевому пулу GoTrue:
 * из 13 почтовых регистраций между 10.06 и 16.08.2026 **ни одна** не дошла до
 * подтверждения — SMTP не был настроен вовсе, письма не уходили никуда. При этом все
 * 5 регистраций через Google прошли. Тринадцать человек оставили нам свою почту,
 * и мы об этом не узнали: они видны только в `auth.users`, куда никто не смотрит.
 *
 * Отсюда устройство: уведомляем в трёх точках, и «начал» отправляется ДО того, как
 * человек подтвердил почту. Даже если он не дойдёт — адрес уже в чате, и написать
 * ему можно руками. Ровно этого не хватало.
 *
 * Только рабочий чат (решение владельца 01.09.2026): регистрация — событие одной
 * площадки, а второй чат общий с kmotors, и их менеджерам это шум.
 */
const CHATS = ['TELEGRAM_WORK_CHAT_ID'] as const;

/**
 * Свежим считается аккаунт моложе суток.
 *
 * Нужно для развилки в `joined`: пул GoTrue общий с kmotors, и клиент kmotors,
 * впервые зашедший к нам старым аккаунтом, тоже получает первую строку
 * в `partsfit_customers`. Регистрацией это не является, и путать их в отчёте нельзя.
 */
const FRESH_MS = 24 * 60 * 60 * 1000;

/** Дата без времени: часовой пояс сервера — не факт о клиенте, и притворяться им незачем. */
function day(value: string | undefined): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toISOString().slice(0, 10);
}

function meta(user: User, key: string): string {
  const value = (user.user_metadata ?? {})[key];
  return typeof value === 'string' ? value.trim() : '';
}

/** Как человек назвался. У Google имя лежит под другим ключом, чем у нашей формы. */
function displayName(user: User): string {
  return meta(user, 'name') || meta(user, 'full_name') || '';
}

/**
 * Отправка не должна ронять то, ради чего вызвана.
 *
 * Регистрация и вход обязаны пройти, даже если Telegram лежит или переменная не задана.
 * Поэтому здесь глухой catch с логом: уведомление — побочный эффект, а не часть сделки
 * с покупателем. Тот же довод, по которому `submitLead` пишет в `leads` в своём try.
 */
async function quietly(title: string, lines: (string | null | false | undefined)[]): Promise<void> {
  try {
    await send({ chats: CHATS, title, lines });
  } catch (error) {
    console.error('[signup-notify] уведомление не ушло:', error);
  }
}

/**
 * Человек начал регистрацию почтой: GoTrue завёл аккаунт, письмо отправлено (или
 * не отправилось), подтверждения ещё нет.
 *
 * Пользователь сюда приходит **проверенным у GoTrue**, а не из тела запроса —
 * см. роут `/api/auth/signup-notify`. Все показанные факты берутся отсюда, поэтому
 * подделать содержимое уведомления нельзя.
 */
export async function notifySignupAttempt(user: User, stage: 'started' | 'mail-failed'): Promise<void> {
  const phone = meta(user, 'phone');
  const marketing = (user.user_metadata ?? {}).marketingOk === true;

  if (stage === 'mail-failed') {
    await quietly('⚠️ Регистрация: письмо НЕ отправлено', [
      `Почта: ${user.email ?? '—'}`,
      displayName(user) && `Имя: ${displayName(user)}`,
      phone && `Телефон: ${phone}`,
      BLANK,
      'Аккаунт в GoTrue заведён, но письмо с подтверждением не ушло — человек застрял.',
      'Войти он не сможет: подтверждения нет. Напишите ему сами или проверьте почтовик',
      '(закрытый порт, домен отправителя, ключ Resend).',
      BLANK,
      'Так уже было: с 10.06 по 16.08.2026 так потерялись 13 регистраций подряд.',
    ]);
    return;
  }

  await quietly('📝 Начал регистрацию почтой', [
    `Почта: ${user.email ?? '—'}`,
    displayName(user) && `Имя: ${displayName(user)}`,
    phone ? `Телефон: ${phone}` : 'Телефон: не указан',
    `Язык: ${meta(user, 'locale') || 'ru'}`,
    `Согласие на рассылку: ${marketing ? 'да' : 'нет'}`,
    BLANK,
    'Письмо с подтверждением отправлено. Пока он по нему не перейдёт, войти нельзя,',
    'и строки в partsfit_customers у него не будет.',
    BLANK,
    'Если следом не придёт «подтвердил и вошёл» — человек застрял на письме,',
    'и почта у вас теперь есть, чтобы написать ему самим.',
  ]);
}

/**
 * Первая строка в `partsfit_customers` — то есть человек прошёл путь до конца.
 *
 * Зовётся из `/api/auth/sync` и только когда строки не было: роут вызывается при
 * каждом входе, и без этой развилки уведомление приходило бы на каждый вход.
 */
export async function notifySignupJoined(
  user: User,
  row: { email: string; name: string; phone: string; locale: string; provider: string; marketing_ok: boolean }
): Promise<void> {
  const fresh = Date.now() - new Date(user.created_at ?? 0).getTime() < FRESH_MS;

  await quietly(fresh ? '✅ Зарегистрировался и вошёл' : '👤 Первый вход к нам старым аккаунтом', [
    `Почта: ${row.email || '—'}`,
    row.name ? `Имя: ${row.name}` : 'Имя: не указано',
    row.phone ? `Телефон: ${row.phone}` : 'Телефон: не указан',
    `Вход: ${row.provider}`,
    `Язык: ${row.locale}`,
    `Согласие на рассылку: ${row.marketing_ok ? 'да' : 'нет'}`,
    !fresh && BLANK,
    // Пул GoTrue общий с kmotors — об этом стоит сказать прямо, иначе старая дата
    // в уведомлении о «регистрации» читается как ошибка.
    !fresh &&
      `Аккаунт заведён ${day(user.created_at)} — это не новая регистрация, а первый вход ` +
        'к нам. Пул аккаунтов общий с kmotors.',
    row.provider === 'google' && !row.phone && BLANK,
    row.provider === 'google' && !row.phone && 'Телефона нет: Google его не отдаёт. Спросить можно в кабинете.',
  ]);
}
