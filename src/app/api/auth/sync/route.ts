import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { userFromRequest } from '@/lib/auth/server';
import type { Customer } from '@/types/customer';

/**
 * Единственный путь, которым данные покупателя попадают в `partsfit_customers`.
 *
 * Вызывается при каждом входе (провайдером в браузере) и при сохранении кабинета.
 * Почта берётся из проверенного токена, а не из тела запроса: иначе любой мог бы
 * записать нам чужой адрес, и список рассылки оказался бы мусорным.
 *
 * Пишет service_role, потому что строки на пользователя может ещё не быть, а политики
 * на insert для `authenticated` в миграции нет намеренно — см. комментарий там.
 *
 * Имя и телефон при первом входе приходят не из тела, а из метаданных пользователя:
 * форма регистрации кладёт их в `signUp`, а строку мы заводим только после первого
 * успешного входа — при подтверждении почты между этими моментами проходит время.
 */

/**
 * Служебный ключ обязателен, и проверяется он здесь, а не в общем клиенте.
 *
 * `createServerClient()` при отсутствии ключа молча берёт анонимный — и это верно
 * для чтения каталога, которое анонимному ключу открыто. Но запись покупателя ему
 * недоступна намеренно, и подмена превращается в «не удалось сохранить» без всякого
 * следа о причине. Ровно так и вышло на проде: ключ там не был задан никогда,
 * а заметили мы это только когда завели первую таблицу, закрытую от анонима.
 *
 * Проверка стоит **внутри обработчика**, а не в теле модуля. Соблазн был обратный —
 * упасть при загрузке, как обещает комментарий в `lib/leads.ts`, — но образ собирается
 * без серверных переменных: Dockerfile передаёт только `NEXT_PUBLIC_*`. Проверка
 * в теле модуля уронила бы сборку на шаге сбора данных о маршрутах, то есть сломала бы
 * деплой ради диагностики. `lib/leads.ts`, вопреки своему комментарию, проверяет
 * ровно так же — по вызову.
 */
const MISSING_KEY =
  'Профиль покупателя не сохранить: не задан SUPABASE_SERVICE_ROLE_KEY. ' +
  'Анонимный ключ на partsfit_customers прав не имеет — это не настройка, а защита.';

const LOCALES = ['ru', 'en', 'ar'];

/** Телефон приходит из PhoneInput в E.164; всё, что на него не похоже, отбрасываем. */
const PHONE = /^\+[1-9]\d{6,18}$/;

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : '';
}

function phone(value: unknown): string | null {
  const raw = text(value, 24);
  if (raw === null) return null;
  if (raw === '') return '';
  return PHONE.test(raw) ? raw : null;
}

/** Первое непустое из присланного, метаданных и уже сохранённого. */
function pick(...values: (string | null | undefined)[]): string {
  return values.find((value) => typeof value === 'string' && value !== '') ?? '';
}

interface Row {
  id: string;
  email: string;
  name: string;
  phone: string;
  locale: string;
  provider: string;
  site: string;
  marketing_ok: boolean;
  created_at: string;
}

function toCustomer(row: Row): Customer {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    locale: row.locale,
    provider: row.provider,
    site: row.site,
    marketingOk: row.marketing_ok,
    createdAt: row.created_at,
  };
}

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[/api/auth/sync]', MISSING_KEY);
    return NextResponse.json({ error: MISSING_KEY }, { status: 500 });
  }

  const user = await userFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Нужен вход' }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    // Пустое тело — штатный случай: так провайдер отмечает вход.
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const supabase = createServerClient();

  const { data: existing } = await supabase
    .from('partsfit_customers')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<Row>();

  const bodyName = text(body.name, 100);
  const bodyPhone = phone(body.phone);
  const bodyLocale = text(body.locale, 8);

  const locale = [bodyLocale, text(meta.locale, 8), existing?.locale].find(
    (value) => value && LOCALES.includes(value)
  );

  const row = {
    id: user.id,
    email: user.email ?? existing?.email ?? '',
    // Присланное имеет приоритет, но пустая строка из формы кабинета — это стирание,
    // а не «нечего сказать»: поэтому проверяем именно на null, а не на пустоту.
    name: bodyName !== null ? bodyName : pick(text(meta.name, 100), existing?.name),
    phone: bodyPhone !== null ? bodyPhone : pick(phone(meta.phone), existing?.phone),
    locale: locale ?? 'ru',
    provider: (user.app_metadata?.provider as string) ?? existing?.provider ?? 'email',
    // Площадку первой записи не переписываем: клиент kmotors, зашедший к нам старым
    // аккаунтом, нашим регистрантом от этого не становится.
    site: existing?.site ?? 'caranalizer',
    marketing_ok:
      typeof body.marketingOk === 'boolean'
        ? body.marketingOk
        : (existing?.marketing_ok ?? meta.marketingOk === true),
    updated_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('partsfit_customers')
    .upsert(row, { onConflict: 'id' })
    .select('*')
    .single<Row>();

  if (error || !data) {
    console.error('[/api/auth/sync]', error);
    return NextResponse.json({ error: 'Не удалось сохранить профиль' }, { status: 500 });
  }

  return NextResponse.json({ customer: toCustomer(data) });
}
