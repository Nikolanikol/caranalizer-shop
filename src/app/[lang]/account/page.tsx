import type { Metadata } from 'next';
import { Container } from '@/components/ui/container';
import { AccountClient } from './AccountClient';

/**
 * Личный кабинет. Содержимое рисуется в браузере: сессия лежит в localStorage,
 * и серверу она не видна — см. комментарий в `components/auth/auth-context.tsx`.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === 'en' ? 'Your account — Caranalizer' : 'Личный кабинет — Caranalizer',
    robots: { index: false, follow: false },
  };
}

export default function AccountPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <AccountClient />
      </div>
    </Container>
  );
}
