import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';
import { notifySignupAttempt } from '@/lib/auth/signup-notify';

/**
 * «Человек начал регистрацию» — уведомление в рабочий чат.
 *
 * Роут нужен потому, что `signUp` идёт из браузера прямо в GoTrue: сервер этого
 * не видит вовсе. Отсюда единственная развилка проекта, где обработчик принимает
 * запрос **без токена** — токена в этот момент ещё не существует: почта не подтверждена,
 * сессии нет.
 *
 * Значит, тело запроса — утверждение постороннего, и доверять ему нельзя ничем.
 * Устройство защиты:
 *
 *   1. Присланное используется ТОЛЬКО как ключ поиска. Все факты в уведомлении берутся
 *      у GoTrue служебным ключом — тот же принцип, что в `/api/auth/sync`, где почта
 *      берётся из проверенного токена, а не из тела.
 *   2. Нет аккаунта — нет сообщения. Чтобы подделать уведомление, надо сперва завести
 *      настоящую регистрацию, а о ней мы и хотим узнать.
 *   3. Аккаунт обязан быть свежим и неподтверждённым. Старый чужой адрес не разбудит
 *      уведомление, и повтор через сутки — тоже.
 *   4. Ответ ОДИН на все случаи. Иначе роут превращается в проверку «есть ли у вас
 *      такая почта»: посторонний перебирал бы адреса и по разнице ответов узнавал,
 *      кто у нас зарегистрирован.
 *
 * Чего здесь сознательно НЕТ — защиты от повтора. Один и тот же свежий аккаунт можно
 * прогнать несколько раз за окно и получить несколько одинаковых сообщений. Атомарный
 * счётчик потребовал бы своей таблицы, а цена ошибки — лишняя строка в чате при потоке
 * в единицы регистраций в месяц. Тот же размен, что у лимита проверок по VIN.
 */

/** Окно, в котором аккаунт считается «только что заведённым». */
const FRESH_MS = 15 * 60 * 1000;

/**
 * Сколько страниц пула просматриваем при поиске по почте.
 *
 * Поиск нужен только для ветки «письмо не ушло»: там `signUp` бросил исключение,
 * объекта пользователя у браузера нет, и в руках остаётся один адрес. Пул общий
 * с kmotors и сейчас крошечный (21 аккаунт на 01.09.2026) — одна страница. Вырастет
 * до тысяч — переходить на `GET /auth/v1/admin/users?filter=<почта>` у GoTrue;
 * пока лишний недокументированный параметр дороже перебора.
 */
const MAX_PAGES = 5;
const PER_PAGE = 200;

const MISSING_KEY =
  'Уведомление о регистрации не отправить: не задан SUPABASE_SERVICE_ROLE_KEY. ' +
  'Без него не спросить у GoTrue, существует ли аккаунт, а верить телу запроса нельзя.';

/**
 * Одинаковый ответ на всё. Это не лень, а пункт 4 из комментария выше.
 *
 * Функция, а не константа: тело `Response` читается ровно один раз, и общий объект
 * на модуль отдал бы содержимое первому запросу, а всем следующим — пустоту. Поймано
 * на проверке: шесть запросов подряд вернули 202 и пустое тело вместо `{"ok":true}`.
 */
const silent = () => NextResponse.json({ ok: true }, { status: 202 });

function field(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function byId(id: string): Promise<User | null> {
  const { data, error } = await createServerClient().auth.admin.getUserById(id);
  if (error || !data?.user) return null;
  return data.user;
}

async function byEmail(email: string): Promise<User | null> {
  const wanted = email.toLowerCase();
  const admin = createServerClient().auth.admin;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { data, error } = await admin.listUsers({ page, perPage: PER_PAGE });
    if (error || !data) return null;

    const found = data.users.find((user) => user.email?.toLowerCase() === wanted);
    if (found) return found;
    if (data.users.length < PER_PAGE) return null;
  }
  return null;
}

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[/api/auth/signup-notify]', MISSING_KEY);
    return silent();
  }

  let body: Record<string, unknown> = {};
  try {
    const parsed: unknown = await request.json();
    // `JSON.parse` успешно разбирает `null`, число и строку: JSON валиден, объектом
    // не является, а обращение к полю у `null` уронило бы роут пятисоткой.
    if (parsed && typeof parsed === 'object') body = parsed as Record<string, unknown>;
  } catch {
    return silent();
  }

  const stage = body.stage === 'mail-failed' ? 'mail-failed' : 'started';
  const userId = field(body.userId, 64);
  const email = field(body.email, 200);
  if (!userId && !email) return silent();

  let user: User | null = null;
  try {
    // По идентификатору — один запрос, и это обычный путь: `signUp` возвращает
    // пользователя даже без сессии. Перебор нужен только когда `signUp` бросил.
    user = userId ? await byId(userId) : await byEmail(email);
  } catch (error) {
    console.error('[/api/auth/signup-notify] GoTrue не ответил:', error);
    return silent();
  }

  if (!user) return silent();

  // Подтверждённый аккаунт про «начал регистрацию» уже не рассказывает: человек прошёл
  // дальше, и об этом отчитается `/api/auth/sync`. Заодно это отсекает локальный стек
  // с выключенным подтверждением — там сообщение было бы двойным.
  if (user.email_confirmed_at) return silent();

  const age = Date.now() - new Date(user.created_at ?? 0).getTime();
  if (!(age >= 0 && age < FRESH_MS)) return silent();

  await notifySignupAttempt(user, stage);
  return silent();
}
