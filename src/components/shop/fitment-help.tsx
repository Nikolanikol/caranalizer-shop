import React from 'react';
import { Link } from '@/i18n/navigation';
import { MessageCircle } from 'lucide-react';
import type { ShopLocale } from '@/lib/shop/terms';
import { ui } from '@/lib/shop/ui-text';

/**
 * Блок «сомневаетесь — спросите» на карточке товара.
 *
 * Здесь была автопроверка VIN через языковую модель. Её убрали вместе с роутом
 * и зависимостью: платный ключ подключать не планируется, а без него покупатель вбивал
 * 17 символов, жал «Проверить» и получал «недоступно» — и так на каждой из 967 карточек.
 *
 * Применимость по-прежнему подтверждает менеджер до выкупа: обещать точное совпадение
 * мы не можем и не будем.
 */
export function FitmentHelp({ locale = 'ru' }: { locale?: ShopLocale }) {
  const t = ui(locale);
  return (
    <div className="bg-base-darker rounded p-4 border border-border-subtle space-y-2">
      <h3 className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
        <MessageCircle className="w-3.5 h-3.5 text-text-muted" />
        {t.notSure}
      </h3>
      <p className="text-[11px] text-text-secondary leading-relaxed">
        {locale === 'en'
          ? 'Send us the VIN and a photo of your old part with the markings readable — we will check before buying and tell you straight if it is the wrong one. '
          : 'Пришлите VIN и фотографию старой детали с читаемой маркировкой — сверим до выкупа и прямо скажем, если деталь не та. '}
        <Link href="/contact" className="text-cta hover:underline">
          {t.howToReach}
        </Link>
      </p>
    </div>
  );
}
