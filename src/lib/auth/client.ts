'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Клиент авторизации. Отдельный от каталожного (`lib/supabase.ts`) намеренно:
 * тот объявлен `persistSession: false` и обязан таким остаться — он читает витрину
 * на сервере сотнями запросов, и сессия ему не нужна вовсе.
 *
 * Синглтон по той же причине, что и там: клиент на каждый вызов утекает.
 *
 * `storageKey` задан явно. По умолчанию supabase-js берёт ключ из адреса проекта,
 * а адрес у нас общий с kmotors — на своём домене мы бы с ними не столкнулись
 * (localStorage привязан к origin), но два клиента в одной вкладке с одинаковым
 * ключом дают предупреждение «Multiple GoTrueClient instances» и делят одну сессию.
 * Своё имя снимает вопрос заранее.
 *
 * PKCE, а не implicit: код обменивается на сессию уже на нашей странице, и токен
 * не проходит через адресную строку — его не видно ни в истории браузера,
 * ни в Referer, ни в логах.
 */
let client: SupabaseClient | null = null;

export function getAuthClient(): SupabaseClient {
  client ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'caranalizer-auth',
      },
    }
  );
  return client;
}
