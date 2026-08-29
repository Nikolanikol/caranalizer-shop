'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getAuthClient } from '@/lib/auth/client';
import type { Customer } from '@/types/customer';

/**
 * Состояние входа на весь сайт.
 *
 * Провайдер клиентский, и это не мелочь: сессия читается из localStorage браузера,
 * а не из cookie. Прочитай мы её на сервере — layout обратился бы к заголовкам запроса,
 * и весь сайт (5 979 пререндеренных маршрутов) стал бы динамическим. Тот же капкан
 * уже сработал однажды с `getLocale()` в корневом layout.
 *
 * Плата за решение: страницы, доступные только вошедшим, придётся закрывать в браузере,
 * а не редиректом на сервере. Для будущей бесплатной проверки по VIN этого достаточно —
 * сам API-роут проверит токен, а не разметку страницы.
 */

interface ProfilePatch {
  name?: string;
  phone?: string;
  marketingOk?: boolean;
  locale?: string;
}

interface AuthValue {
  user: User | null;
  /** Наша строка покупателя. Подгружается по требованию — в кабинете. */
  customer: Customer | null;
  /** true, пока не выяснили, есть сессия или нет. Не путать с «не вошёл». */
  loading: boolean;
  signOut: () => Promise<void>;
  /** Перечитать профиль с сервера. */
  refresh: () => Promise<Customer | null>;
  /** Сохранить имя, телефон и согласие на рассылку. */
  saveProfile: (patch: ProfilePatch) => Promise<Customer | null>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth вызван вне AuthProvider');
  return value;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Запрос к нашему API от имени вошедшего. Токен идёт заголовком: сессия живёт
   * в localStorage, cookie у неё нет, и сервер иначе о ней не узнает.
   *
   * Токен спрашиваем у клиента, а не берём из стейта: у него сессия в памяти всегда
   * свежая, и просроченный он обновит сам. Стейт же на момент вызова из колбэка
   * может отставать на один рендер — как раз в момент входа, когда сохранять и надо.
   */
  const sync = useCallback(async (patch: ProfilePatch | null): Promise<Customer | null> => {
    const { data } = await getAuthClient().auth.getSession();
    const token = data.session?.access_token;
    if (!token) return null;

    try {
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(patch ?? {}),
      });
      if (!response.ok) return null;
      const data = (await response.json()) as { customer: Customer };
      setCustomer(data.customer);
      return data.customer;
    } catch {
      // Профиль не сохранился — вход при этом состоялся, и ронять из-за этого нечего.
      return null;
    }
  }, []);

  useEffect(() => {
    const supabase = getAuthClient();

    /*
     * INITIAL_SESSION приходит сразу после подписки — отдельный getSession() не нужен.
     * Строку покупателя обновляем только на настоящем входе: делать это на каждой
     * загрузке страницы значило бы писать в базу при каждом переходе.
     */
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setLoading(false);
      if (!next) setCustomer(null);
      if (event === 'SIGNED_IN') void sync(null);
    });

    return () => data.subscription.unsubscribe();
  }, [sync]);

  const signOut = useCallback(async () => {
    await getAuthClient().auth.signOut();
    setSession(null);
    setCustomer(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user: session?.user ?? null,
      customer,
      loading,
      signOut,
      refresh: () => sync(null),
      saveProfile: (patch: ProfilePatch) => sync(patch),
    }),
    [session, customer, loading, signOut, sync]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
