import React from 'react';
import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { PageShell, Section, Todo } from '@/components/shop/page-shell';
import { RUSSIAN_CITIES } from '@/lib/shop/delivery';
import { shopUrl } from '@/lib/shop/urls';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Доставка и оплата запчастей из Кореи',
  description:
    'Как доставляются запчасти из Южной Кореи в Россию: EMS и морская отправка, сроки по городам, способы оплаты. Стоимость доставки менеджер считает по вашей заявке.',
  alternates: { canonical: shopUrl('/zapchasti/dostavka-i-oplata', SITE_URL) },
};

export default function DeliveryPage() {
  return (
    <PageShell
      title="Доставка и оплата"
      intro="Мы выкупаем деталь на разборке в Южной Корее под конкретную заявку и отправляем её в Россию. Поэтому итоговая сумма собирается из двух частей: цена детали на сайте и доставка, которую считает менеджер."
    >
      <Section title="Сначала заявка, потом оплата">
        <p>
          Кнопка «Оформить заявку» ничего не списывает. Заявка уходит менеджеру, он подтверждает, что деталь
          на месте, присылает дополнительные фотографии и называет итоговую сумму с доставкой. Только после
          вашего согласия деталь выкупается.
        </p>
        <p>
          Поэтому в корзине вы видите сумму только за детали. Мы не показываем предварительную стоимость
          доставки: она зависит от веса, габаритов и способа отправки, и любое число до расчёта было бы
          обещанием, которого мы не давали.
        </p>
      </Section>

      <Section title="Способы отправки">
        <p>
          <strong className="text-text-secondary">EMS (Почта России).</strong> Авиаотправление, подходит для
          одной-двух деталей. Быстрее, дороже, отслеживается по трек-номеру на всём пути.
        </p>
        <p>
          <strong className="text-text-secondary">Морская отправка.</strong> Выгоднее по цене, особенно для
          крупногабаритной оптики и заказов из нескольких позиций. Дольше по срокам, идёт через Владивосток.
        </p>
        <Todo>
          Нужны реальные условия: сроки EMS и морем в днях, от какого веса выгоднее море, кто платит
          таможенные сборы и есть ли лимит беспошлинного ввоза. Я эти цифры не придумываю — пришлите,
          и я поставлю их сюда вместо этого блока.
        </Todo>
      </Section>

      <Section title="Сроки по городам">
        <p>
          Ориентировочные сроки от отправки из Кореи до получения. Это оценка для планирования, а не
          обязательство перевозчика — точный срок менеджер называет по конкретной отправке.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-border-subtle rounded">
            <thead>
              <tr className="bg-base-darker text-text-secondary text-left">
                <th className="px-4 py-2.5 font-bold uppercase tracking-widest text-[10px]">Город</th>
                <th className="px-4 py-2.5 font-bold uppercase tracking-widest text-[10px]">Срок</th>
              </tr>
            </thead>
            <tbody>
              {RUSSIAN_CITIES.map((city) => (
                <tr key={city.name} className="border-t border-border-subtle">
                  <td className="px-4 py-2.5 text-text-secondary">{city.name}</td>
                  <td className="px-4 py-2.5 text-text-secondary tabular-nums">{city.days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Оплата">
        <p>
          В заявке вы отмечаете удобный способ — СБП по QR-коду, карта российского банка или безналичный
          расчёт для юридических лиц. Это пожелание: реквизиты на оплату менеджер присылает после того,
          как подтвердил наличие детали и посчитал доставку.
        </p>
        <p>
          Оплату на сайте мы не принимаем и карточные данные не запрашиваем — ни в форме заявки,
          ни в переписке.
        </p>
      </Section>

      <Section title="Если деталь не подошла">
        <p>
          Условия возврата и что делать при повреждении в пути — на странице{' '}
          <Link href="/zapchasti/garantiya-i-vozvrat" className="text-cta hover:underline">
            «Гарантия и возврат»
          </Link>
          .
        </p>
      </Section>
    </PageShell>
  );
}
