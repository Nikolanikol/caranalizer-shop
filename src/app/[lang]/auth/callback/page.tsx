import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Container } from '@/components/ui/container';
import { CallbackClient } from './CallbackClient';

/**
 * Возврат из Google и переход по ссылке из письма.
 *
 * Отдельная страница, а не серверный роут обмена кода: сессия живёт в localStorage
 * браузера, а не в cookie, и обменять код на сессию может только он. Серверный вариант
 * потребовал бы cookie — то есть чтения запроса и потери статики на всём сайте.
 */
export const metadata: Metadata = {
  title: 'Caranalizer',
  robots: { index: false, follow: false },
};

export default function AuthCallbackPage() {
  return (
    <Container className="py-20">
      <Suspense fallback={null}>
        <CallbackClient />
      </Suspense>
    </Container>
  );
}
