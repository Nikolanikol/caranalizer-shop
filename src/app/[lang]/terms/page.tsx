import type { Metadata } from "next";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/container";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const titles: Record<string, string> = {
    ru: "Пользовательское соглашение | Caranalizer",
    en: "Terms of Service | Caranalizer",
    ar: "شروط الخدمة | Caranalizer",
  };
  return {
    title: titles[lang],
    robots: { index: false },
  };
}

export default function TermsPage() {
  const locale = useLocale();

  if (locale === "en") return (
    <section className="py-12">
      <Container className="max-w-3xl">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-text-dim mb-10">Last updated: June 2026</p>

        <div className="space-y-8 text-text-muted leading-relaxed">
          <div>
            <h2 className="text-text text-xl font-semibold mb-3">1. Scope</h2>
            <p>Caranalizer (caranalizer.com) is a platform for browsing and requesting genuine OEM spare parts for Korean vehicles. By using the site you agree to these terms.</p>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">2. Order Status</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Submitting a cart request does <strong className="text-text">not</strong> constitute a confirmed order.</li>
              <li>An order is confirmed only after written confirmation from our manager via Telegram.</li>
              <li>Prices shown on the site are indicative. The final price is agreed with the manager at the time of confirmation.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">3. Prices & Payment</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Prices are listed in KRW. Conversion to other currencies is approximate.</li>
              <li>The exchange rate is fixed at the time of invoice issued by the manager.</li>
              <li>Payment methods are agreed individually with the manager.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">4. Shipping & Delivery</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Estimated delivery time is 7–14 business days and may vary depending on destination and customs.</li>
              <li>Shipping cost is calculated by the manager separately and is not included in the product price.</li>
              <li>Any customs duties, taxes and import fees are the sole responsibility of the buyer.</li>
              <li>We are not liable for delays caused by customs authorities or postal services.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">5. Product Authenticity</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>All parts are genuine OEM parts sourced directly from Hyundai Mobis, Korea.</li>
              <li>A photo and video report of your parts is provided before shipment.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">6. Returns & Claims</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Returns are accepted <strong className="text-text">only in the case of a manufacturer defect</strong>.</li>
              <li>All return shipping costs are the responsibility of the buyer.</li>
              <li>Claims must be submitted within <strong className="text-text">14 days</strong> of receiving the order.</li>
              <li>No claims are accepted for parts selected incorrectly by the buyer.</li>
              <li>To file a claim, contact us via Telegram with photos/video confirming the defect.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">7. Limitation of Liability</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Caranalizer is not liable for customs delays or losses caused by postal/courier services.</li>
              <li>Caranalizer is not liable for damage resulting from incorrect part selection by the buyer.</li>
              <li>Caranalizer is not liable for indirect or consequential damages.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">8. Contact</h2>
            <p>For any questions regarding these terms: <a href="https://t.me/kmotors_bot" className="text-primary hover:underline">Telegram Manager</a></p>
          </div>
        </div>
      </Container>
    </section>
  );

  if (locale === "ar") return (
    <section className="py-12">
      <Container className="max-w-3xl">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold mb-2">شروط الخدمة</h1>
        <p className="text-sm text-text-dim mb-10">آخر تحديث: يونيو 2026</p>

        <div className="space-y-8 text-text-muted leading-relaxed">
          <div>
            <h2 className="text-text text-xl font-semibold mb-3">١. النطاق</h2>
            <p>Caranalizer (caranalizer.com) منصة لتصفح وطلب قطع غيار أصلية للسيارات الكورية. باستخدامك للموقع، فإنك توافق على هذه الشروط.</p>
          </div>
          <div>
            <h2 className="text-text text-xl font-semibold mb-3">٢. حالة الطلب</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>تقديم طلب من سلة التسوق <strong className="text-text">لا يُعدّ</strong> تأكيداً للطلب.</li>
              <li>يُعتبر الطلب مؤكداً فقط بعد تأكيد المدير عبر تيليغرام.</li>
              <li>الأسعار المعروضة تقريبية، والسعر النهائي يُتفق عليه مع المدير.</li>
            </ul>
          </div>
          <div>
            <h2 className="text-text text-xl font-semibold mb-3">٣. الأسعار والدفع</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>الأسعار بالوون الكوري، والتحويل إلى العملات الأخرى تقريبي.</li>
              <li>سعر الصرف يُثبَّت عند إصدار الفاتورة من المدير.</li>
              <li>طرق الدفع تُتفق عليها بشكل فردي مع المدير.</li>
            </ul>
          </div>
          <div>
            <h2 className="text-text text-xl font-semibold mb-3">٤. الشحن والتسليم</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>مدة التسليم المقدرة ٧-١٤ يوم عمل وقد تتفاوت حسب الوجهة والجمارك.</li>
              <li>تكلفة الشحن تُحسب من قبل المدير وغير مشمولة في سعر المنتج.</li>
              <li>رسوم الجمارك والضرائب تقع على عاتق المشتري بالكامل.</li>
            </ul>
          </div>
          <div>
            <h2 className="text-text text-xl font-semibold mb-3">٥. الإرجاع والمطالبات</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>يُقبل الإرجاع <strong className="text-text">فقط في حالة عيب مصنعي</strong>.</li>
              <li>تكاليف شحن الإرجاع تقع على عاتق المشتري.</li>
              <li>يجب تقديم المطالبة خلال <strong className="text-text">١٤ يوماً</strong> من استلام الطلب.</li>
              <li>لا تُقبل مطالبات القطع التي اختارها المشتري بشكل خاطئ.</li>
            </ul>
          </div>
          <div>
            <h2 className="text-text text-xl font-semibold mb-3">٦. التواصل</h2>
            <p><a href="https://t.me/kmotors_bot" className="text-primary hover:underline">مدير تيليغرام</a></p>
          </div>
        </div>
      </Container>
    </section>
  );

  // Russian (default)
  return (
    <section className="py-12">
      <Container className="max-w-3xl">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold mb-2">Пользовательское соглашение</h1>
        <p className="text-sm text-text-dim mb-10">Последнее обновление: июнь 2026</p>

        <div className="space-y-8 text-text-muted leading-relaxed">
          <div>
            <h2 className="text-text text-xl font-semibold mb-3">1. Предмет соглашения</h2>
            <p>Caranalizer (caranalizer.com) — платформа для просмотра и оформления заявок на оригинальные OEM запчасти для корейских автомобилей. Используя сайт, вы соглашаетесь с настоящим соглашением.</p>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">2. Статус заказа</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Оформление заявки через корзину <strong className="text-text">не является</strong> подтверждённым заказом.</li>
              <li>Заказ считается принятым только после письменного подтверждения менеджера в Telegram.</li>
              <li>Цены на сайте являются ориентировочными. Финальная цена согласовывается с менеджером в момент подтверждения.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">3. Цены и оплата</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Цены указаны в корейских вонах (KRW). Конвертация в другие валюты на сайте является приблизительной.</li>
              <li>Курс валюты фиксируется на момент выставления счёта менеджером.</li>
              <li>Способы оплаты согласовываются индивидуально с менеджером.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">4. Доставка</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Ориентировочный срок доставки — 7–14 рабочих дней. Фактический срок может отличаться в зависимости от страны назначения и таможни.</li>
              <li>Стоимость доставки рассчитывается менеджером отдельно и не включена в цену товара на сайте.</li>
              <li>Таможенные пошлины, налоги и сборы при ввозе оплачиваются покупателем самостоятельно.</li>
              <li>Мы не несём ответственности за задержки, вызванные таможенными органами или почтовыми службами.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">5. Оригинальность товара</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Все запчасти являются оригинальными OEM деталями, поставляемыми напрямую от Hyundai Mobis, Корея.</li>
              <li>Перед отправкой каждого заказа предоставляется фото и видео отчёт.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">6. Возврат и претензии</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Возврат товара возможен <strong className="text-text">исключительно при наличии заводского брака</strong>.</li>
              <li>Все расходы по обратной доставке при возврате несёт покупатель.</li>
              <li>Претензия должна быть подана в течение <strong className="text-text">14 дней</strong> с момента получения заказа.</li>
              <li>Претензии по причине неверного подбора запчасти покупателем не принимаются.</li>
              <li>Для подачи претензии необходимо обратиться к менеджеру в Telegram с фото/видео подтверждением дефекта.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">7. Ограничение ответственности</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Caranalizer не несёт ответственности за задержки на таможне или утрату груза службами доставки.</li>
              <li>Caranalizer не несёт ответственности за ущерб, возникший вследствие неверного выбора запчасти покупателем.</li>
              <li>Caranalizer не несёт ответственности за косвенные или сопутствующие убытки.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">8. Контакты</h2>
            <p>По всем вопросам: <a href="https://t.me/kmotors_bot" className="text-primary hover:underline">Менеджер в Telegram</a></p>
          </div>
        </div>
      </Container>
    </section>
  );
}
