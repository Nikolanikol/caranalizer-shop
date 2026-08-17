import React from 'react';
import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { PageShell, Section } from '@/components/shop/page-shell';
import { RUSSIAN_CITIES } from '@/lib/shop/delivery';
import { shopUrl } from '@/lib/shop/urls';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Доставка и оплата запчастей из Кореи',
  description:
    'Как доставляются запчасти из Южной Кореи в Россию: EMS и морская отправка, сроки по городам, способы оплаты. Стоимость доставки менеджер считает по вашей заявке.',
  alternates: { canonical: shopUrl('/zapchasti/dostavka-i-oplata', SITE_URL) },
};

/**
 * ДОПОЛНИТЬ ОБЯЗАТЕЛЬНО. Условия ниже — со слов владельца, первая версия. Не хватает:
 *
 * - от какого веса и объёма море выгоднее авиа (сейчас сказано «для крупного и сборных»
 *   качественно, без порога в килограммах);
 * - лимит беспошлинного ввоза и с какой суммы возникает пошлина;
 * - сроки морем по городам: таблица ниже построена под EMS, для моря она неверна;
 * - реквизиты для инвойса юрлицам — они же нужны на странице «Как заказать».
 */
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
          <strong className="text-text-secondary">EMS, авиа.</strong> От недели до полутора недель
          до получателя. Подходит для одной-двух деталей, отслеживается по трек-номеру на всём пути.
          Дороже, но предсказуемо по срокам.
        </p>
        <p>
          <strong className="text-text-secondary">Морская отправка.</strong> До двух месяцев. Выгоднее
          по цене — особенно для крупногабаритной оптики и заказов из нескольких позиций. Идёт через
          Владивосток.
        </p>
        <p>
          <strong className="text-text-secondary">Таможенные сборы платит покупатель.</strong> Они
          не входят ни в цену детали, ни в стоимость доставки, которую считает менеджер, и начисляются
          отдельно при ввозе. Менеджер предупредит, если по вашей отправке они ожидаются.
        </p>
      </Section>

      <Section title="Сроки по городам">
        <p>
          Ориентировочные сроки для отправки <strong className="text-text-secondary">авиа (EMS)</strong> —
          от отправки из Кореи до получения. Для морской отправки они не подходят: там счёт идёт
          на недели и до двух месяцев. Это оценка для планирования, а не обязательство перевозчика —
          точный срок менеджер называет по конкретной отправке.
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
          <strong className="text-text-secondary">QwikPay на «Золотую Корону».</strong> Основной способ
          для физических лиц: перевод по реквизитам, которые менеджер присылает после подтверждения наличия.
        </p>
        <p>
          <strong className="text-text-secondary">Инвойс на юридическое лицо.</strong> Безналичный расчёт
          по счёту — для организаций и ИП, с закрывающими документами.
        </p>
        <p>
          <strong className="text-text-secondary">PayPal.</strong> Для оплаты из-за пределов России.
        </p>
        <p>
          В заявке вы отмечаете удобный способ — это пожелание, а не оплата. Реквизиты менеджер присылает
          после того, как подтвердил наличие детали и посчитал доставку.
        </p>
        <p>
          Оплату на сайте мы не принимаем и карточные данные не запрашиваем — ни в форме заявки,
          ни в переписке. Если кто-то просит их от нашего имени, это не мы.
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
