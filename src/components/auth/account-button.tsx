'use client';

import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { CircleUserRound } from 'lucide-react';
import { useAuth } from './auth-context';

/**
 * Вход и кабинет в шапке.
 *
 * Пока состояние неизвестно (сессия читается из localStorage уже в браузере),
 * место занимает пустая заглушка тех же размеров: без неё шапка дёргалась бы
 * на каждой загрузке — сначала «Войти», потом кабинет.
 *
 * На узких экранах остаётся только значок: рядом стоят корзина, переключатель языка
 * и кнопка меню, а горизонтальная тесная шапка — это то, от чего раздел уводили.
 */
export function AccountButton() {
  const { user, loading } = useAuth();
  const en = useLocale() === 'en';

  if (loading) return <span className="h-9 w-9 shrink-0" aria-hidden="true" />;

  const signedIn = Boolean(user);
  const label = signedIn ? (en ? 'Account' : 'Кабинет') : en ? 'Sign in' : 'Войти';

  return (
    <Link
      href={signedIn ? '/account' : '/auth'}
      aria-label={label}
      className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-elevated hover:text-text"
    >
      <CircleUserRound className={`h-5 w-5 ${signedIn ? 'text-primary' : ''}`} />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
