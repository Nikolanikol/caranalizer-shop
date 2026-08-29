import 'server-only';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

/**
 * Проверка токена на сервере.
 *
 * Сессия живёт в localStorage браузера, а не в cookie, и это выбрано сознательно:
 * чтение cookie в layout перевело бы в динамику весь сайт — 5 979 пререндеренных
 * маршрутов держатся ровно на том, что серверные компоненты не трогают запрос.
 * Поэтому браузер присылает токен заголовком, а сервер проверяет его у GoTrue.
 *
 * Проверять обязательно: `sub` из тела запроса — это утверждение браузера, а не факт.
 * `auth.getUser(token)` ходит в GoTrue и возвращает пользователя, только если подпись
 * и срок годности сошлись.
 */
let verifier: SupabaseClient | null = null;

function getVerifier(): SupabaseClient {
  verifier ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
  return verifier;
}

/** Токен из заголовка `Authorization: Bearer …`. */
export function bearerToken(request: Request): string | null {
  const header = request.headers.get('authorization') ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/** Пользователь по токену запроса или `null`, если токена нет либо он не принят. */
export async function userFromRequest(request: Request): Promise<User | null> {
  const token = bearerToken(request);
  if (!token) return null;

  const { data, error } = await getVerifier().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
