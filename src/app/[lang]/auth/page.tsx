import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Container } from '@/components/ui/container';
import { AuthForm } from './AuthForm';

/**
 * Вход и регистрация. Страница остаётся статической: параметры (`mode`, `next`)
 * читает уже форма в браузере, а `searchParams` на сервере перевели бы маршрут
 * в динамику без всякой пользы — разметка от них не зависит.
 *
 * `noindex` обязателен: страница входа в поиске не нужна, а канонический адрес
 * у неё был бы дублем на каждый язык.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === 'en' ? 'Sign in — Caranalizer' : 'Вход и регистрация — Caranalizer',
    robots: { index: false, follow: false },
  };
}

export default function AuthPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <Suspense
          fallback={<div className="h-[28rem] animate-pulse rounded-2xl border border-border bg-surface" />}
        >
          <AuthForm />
        </Suspense>
      </div>
    </Container>
  );
}
