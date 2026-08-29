'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Loader2 } from 'lucide-react';
import { getAuthClient } from '@/lib/auth/client';
import { trackLogin } from '@/lib/analytics';

/**
 * Ждём, пока клиент обменяет код из адреса на сессию (`detectSessionInUrl`), и уводим
 * дальше. Ожидание ограничено: если провайдер вернул ошибку или ссылка из письма
 * протухла, человек должен увидеть это, а не крутящийся кружок.
 */
const TIMEOUT_MS = 10_000;

export function CallbackClient() {
  const locale = useLocale() === 'en' ? 'en' : 'ru';
  const t = TEXT[locale];
  const params = useSearchParams();
  const router = useRouter();
  const [failed, setFailed] = useState('');

  useEffect(() => {
    const next = params.get('next');
    const destination = next && next.startsWith('/') && !next.startsWith('//') ? next : '/account';

    let done = false;
    /*
     * Сюда приходят и после Google, и по ссылке из письма — способ входа берём
     * у самой сессии, иначе подтверждение почты считалось бы входом через Google.
     */
    const finish = (session: Session) => {
      if (done) return;
      done = true;
      trackLogin(session.user.app_metadata?.provider === 'google' ? 'google' : 'email');
      router.replace(destination);
    };

    const supabase = getAuthClient();

    /*
     * Проверка отказа и сессии — в асинхронной ветке, а не в теле эффекта: там
     * setState вызывает каскадный рендер, и линтер правил React такое запрещает.
     * Заодно это честнее: обмен кода на сессию всё равно асинхронный.
     */
    const check = async () => {
      // GoTrue сообщает об отказе параметром — и в строке запроса, и во фрагменте.
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const denied =
        params.get('error_description') ?? hash.get('error_description') ?? params.get('error');
      if (denied) {
        setFailed(denied);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) finish(data.session);
    };
    void check();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish(session);
    });

    const timer = setTimeout(() => {
      if (!done) setFailed(t.timeout);
    }, TIMEOUT_MS);

    return () => {
      data.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [params, router, t.timeout]);

  if (failed) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-8 text-center">
        <h1 className="mb-2 text-lg font-semibold text-text">{t.title}</h1>
        <p className="mb-6 text-sm text-text-secondary">{failed}</p>
        <Link href="/auth" className="text-sm font-semibold text-primary hover:underline">
          {t.retry}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-10 text-text-secondary">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm">{t.wait}</p>
    </div>
  );
}

const TEXT = {
  ru: {
    wait: 'Входим…',
    title: 'Войти не получилось',
    timeout: 'Ссылка устарела или вход не завершился. Попробуйте ещё раз.',
    retry: 'Вернуться ко входу',
  },
  en: {
    wait: 'Signing you in…',
    title: 'Sign-in did not go through',
    timeout: 'The link has expired or the sign-in did not finish. Please try again.',
    retry: 'Back to sign in',
  },
} as const;
