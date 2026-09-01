import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { userFromRequest } from '@/lib/auth/server';
import { VIN_HISTORY_PAGE_SIZE, type VinLookup, type VinLookupPage } from '@/types/vin-lookup';

/**
 * Журнал проверок по VIN — свой, постранично.
 *
 * Данные закрыты здесь, а не разметкой кабинета: сессия живёт в localStorage,
 * и спрятанный версткой список отдал бы историю всякому, кто откроет вкладку сети.
 * Правило то же, что у `/api/vin`.
 *
 * Чужую историю не отдаём, и держится это на `eq('user_id', …)`, а не на RLS:
 * `createServerClient()` берёт service_role, который политики обходит. Фильтр здесь —
 * единственный рубеж, и трогать его нельзя, даже если политика в миграции выглядит
 * достаточной.
 */

/** Больше тысячи страниц не листает никто, а число из адреса приходит от постороннего. */
const MAX_PAGE = 1000;

function pageParam(url: string): number {
  const raw = Number(new URL(url).searchParams.get('page'));
  if (!Number.isFinite(raw)) return 1;
  return Math.min(MAX_PAGE, Math.max(1, Math.trunc(raw)));
}

export async function GET(request: Request) {
  /*
   * Отказ проверки токена — это «не вошёл», а не 500: `userFromRequest` ходит по сети
   * в GoTrue и падать может от чего угодно. Закрываемся, а не открываемся.
   */
  let user: Awaited<ReturnType<typeof userFromRequest>> = null;
  try {
    user = await userFromRequest(request);
  } catch (error) {
    console.warn('[/api/vin/history] проверка токена не удалась:', error);
  }

  if (!user) {
    return NextResponse.json({ error: 'Требуется вход' }, { status: 401 });
  }

  const page = pageParam(request.url);
  const from = (page - 1) * VIN_HISTORY_PAGE_SIZE;

  const { data, count, error } = await createServerClient()
    .from('partsfit_vin_lookups')
    .select('vin, registry, looked_up_at', { count: 'exact' })
    .eq('user_id', user.id)
    .order('looked_up_at', { ascending: false })
    .range(from, from + VIN_HISTORY_PAGE_SIZE - 1);

  /*
   * Отказ базы отдаём отказом, а не пустым списком. Пустой список читается как
   * «вы ничего не проверяли» — это неправда, и человек решит, что мы потеряли историю.
   * Сюда же попадёт случай незаданного SUPABASE_SERVICE_ROLE_KEY: анонимный ключ
   * на этой таблице прав не имеет вовсе.
   */
  if (error) {
    console.error('[/api/vin/history] журнал не прочитан:', error.message);
    return NextResponse.json({ error: 'Не удалось загрузить историю' }, { status: 502 });
  }

  const total = count ?? 0;
  const items: VinLookup[] = (data ?? []).map((row) => ({
    vin: String(row.vin),
    registry: String(row.registry),
    lookedUpAt: String(row.looked_up_at),
  }));

  const body: VinLookupPage = {
    items,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / VIN_HISTORY_PAGE_SIZE)),
  };
  return NextResponse.json(body);
}
