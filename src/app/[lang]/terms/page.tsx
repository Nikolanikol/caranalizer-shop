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
            <p>For any questions regarding these terms: <a href="https://t.me/axiskorea" className="text-primary hover:underline">Telegram Manager</a></p>
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
            <p><a href="https://t.me/axiskorea" className="text-primary hover:underline">مدير تيليغرام</a></p>
          </div>
        </div>
      </Container>
    </section>
  );

  // Russian (default)
  return (
    <section className="py-12">
      <Container className="max-w-3xl">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold mb-2">Пользовательское соглашение платформы Caranalizer</h1>
        <p className="text-sm text-text-dim mb-10">Последнее обновление: Июнь 2026</p>

        <div className="space-y-8 text-text-muted leading-relaxed">
          <div>
            <h2 className="text-text text-xl font-semibold mb-3">1. Предмет соглашения</h2>
            <p>Платформа Caranalizer (caranalizer.com) является онлайн-сервисом для ознакомления с ассортиментом и оформления предварительных заявок на оригинальные OEM автозапчасти для корейских автомобилей.</p>
            <p className="mt-3">Использование сайта, отправка любых форм обратной связи или оформление заявки через корзину означает полное и безоговорочное согласие Пользователя с настоящим Соглашением.</p>
            <p className="mt-3">Администрация платформы оставляет за собой право в одностороннем порядке изменять или обновлять настоящее Соглашение в любой момент без предварительного уведомления Пользователей. Новая редакция Соглашения вступает в силу с момента её публикации на сайте caranalizer.com.</p>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">2. Статус заявки и подтверждение заказа</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Оформление заявки через корзину на сайте <strong className="text-text">не является</strong> подтверждённым заказом и не накладывает на платформу обязательств по продаже товара.</li>
              <li>Заказ считается принятым в обработку и обязательным к исполнению только после его индивидуального письменного подтверждения менеджером в мессенджере Telegram.</li>
              <li>Все цены, указанные на сайте, являются ориентировочными. Финальная стоимость деталей и заказа согласовывается и фиксируется менеджером в момент подтверждения.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">3. Цены и оплата</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Базовой валютой платформы являются корейские воны (KRW). Любая конвертация в другие валюты на сайте носит исключительно информационный характер и является приблизительной.</li>
              <li>Курс валюты для оплаты окончательно фиксируется менеджером на момент выставления счёта.</li>
              <li>Способы, условия и каналы оплаты согласовываются с менеджером в индивидуальном порядке через Telegram.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">4. Доставка и переход рисков</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Ориентировочный срок доставки составляет 7–14 рабочих дней. Фактический срок может отличаться в зависимости от страны назначения, выбранных логистических маршрутов и работы таможенных органов.</li>
              <li>Стоимость международной доставки рассчитывается менеджером отдельно для каждого заказа и не включена в стоимость товара на сайте.</li>
              <li><strong className="text-text">Переход рисков:</strong> Право собственности на товар, а также риски его случайной гибели, утраты или повреждения в полном объёме переходят к Покупателю в момент передачи отправления первой службе доставки (перевозчику) или почтовой службе на территории Республики Корея.</li>
              <li>Таможенные пошлины, импортные налоги, сборы и иные расходы, связанные с ввозом товара в страну назначения, оплачиваются Покупателем самостоятельно.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">5. Оригинальность и контроль качества товара</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Все поставляемые запчасти являются оригинальными OEM деталями, поставляемыми напрямую от автопроизводителей и официальных дистрибьюторов из Южной Кореи.</li>
              <li>В целях контроля качества, перед фактической отправкой каждого заказа Покупателю предоставляется фото- и/или видеоотчёт собранных деталей.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">6. Возврат и рекламации (претензии)</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Возврат или обмен товара возможен <strong className="text-text">исключительно при обнаружении подтверждённого заводского брака</strong>.</li>
              <li>Претензии по причине неверного подбора запчасти, артикула или кросс-номера силами самого Покупателя не принимаются. Ответственность за корректность выбора детали лежит на Покупателе.</li>
              <li>Для подачи претензии Покупатель обязан обратиться к менеджеру в Telegram в течение <strong className="text-text">14 календарных дней</strong> с момента фактического получения заказа, предоставив подробные фото- и видеоматериалы, фиксирующие дефект.</li>
              <li>В случае согласования возврата, все расходы по обратной транспортировке товара на склад в Южной Корее в полном объёме несёт Покупатель.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">7. Ограничение ответственности</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Платформа Caranalizer не несёт ответственности за любые задержки на таможне, действия государственных органов, утерю, порчу или уничтожение груза транспортными компаниями и почтовыми службами.</li>
              <li>Платформа не несёт ответственности за прямой или косвенный ущерб, упущенную выгоду или сопутствующие убытки, возникшие вследствие использования сайта, задержек в поставке или неверного выбора детали Покупателем.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">8. Форс-мажор</h2>
            <p>Стороны освобождаются от ответственности за полное или частичное неисполнение своих обязательств, если оно явилось следствием обстоятельств непреодолимой силы, возникших после подтверждения заказа.</p>
            <p className="mt-3">К таким обстоятельствам относятся: военные действия, экономические санкции, эмбарго, торговые ограничения, стихийные бедствия, изменения национального или международного законодательства, забастовки, глобальные логистические коллапсы и иные события, находящиеся вне разумного контроля Администрации платформы.</p>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">9. Применимое право и разрешение споров</h2>
            <p>Настоящее Соглашение и все правоотношения, возникающие в связи с использованием платформы, регулируются законодательством Республики Корея.</p>
            <p className="mt-3">Все споры подлежат обязательному досудебному урегулированию путём прямых переговоров в мессенджере Telegram. В случае невозможности достижения согласия, спор подлежит рассмотрению в компетентном суде по месту регистрации владельца платформы в Республике Корея.</p>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">10. Конфиденциальность и защита данных</h2>
            <p>Оформляя заявку на сайте caranalizer.com, Пользователь даёт своё полное и добровольное согласие на сбор, хранение и обработку предоставленных им персональных данных (включая имя, контактный телефон, никнейм в Telegram, адрес доставки) исключительно для целей обработки заказа и осуществления коммуникации.</p>
          </div>

          <div>
            <h2 className="text-text text-xl font-semibold mb-3">11. Контакты и связь</h2>
            <p>По всем вопросам, связанным с работой платформы, подбором запчастей и оформлением заявок: <a href="https://t.me/axiskorea" className="text-primary hover:underline">Менеджер в Telegram</a></p>
          </div>
        </div>
      </Container>
    </section>
  );
}
