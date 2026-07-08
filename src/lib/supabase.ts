import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

// Auth-сессии в проекте не используются (только anon/service-key REST),
// поэтому клиенты — синглтоны. Клиент на каждый вызов утекал: ~330 КБ
// на запрос, OOM процесса каждые ~40-60 минут под краулер-трафиком.
const NO_AUTH = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
} as const;

let browserClient: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

export function createBrowserClient() {
  browserClient ??= createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    NO_AUTH
  );
  return browserClient;
}

export function createServerClient() {
  serverClient ??= createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    NO_AUTH
  );
  return serverClient;
}
