import type { Metadata } from "next";
import { useLocale } from "next-intl";
import { GuideLayout, guideMetadata, type GuideContent } from "../GuideLayout";
import type { GuideLocale } from "@/lib/guides";

const SLUG = "avto-iz-korei-v-kazahstan";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return guideMetadata(SLUG, lang);
}

const CALC_URL =
  "https://www.kmotors.shop/ru/calculator?utm_source=caranalizer&utm_medium=guide&utm_campaign=kz";

const CONTENT: Record<GuideLocale, GuideContent> = {
  ru: {
    intro: [
      "Казахстан — одно из главных направлений экспорта корейских авто: правый руль не нужен, санкционные ограничения мягче, а разница цен на свежие Hyundai, Kia и Genesis остаётся ощутимой.",
      "Разбираем весь маршрут: от выбора машины в Корее до постановки на учёт в Казахстане — и из чего складывается итоговая цена.",
    ],
    sections: [
      {
        h: "Из чего складывается цена «под ключ»",
        list: [
          "Цена машины в Корее (плюс комиссия площадки/аукциона).",
          "Услуги экспортёра: осмотр, выкуп, снятие с учёта, экспортные документы.",
          "Доставка: автовоз или контейнер до границы/порта, далее до вашего города.",
          "Таможенные платежи Казахстана: пошлина, НДС, акциз (для больших моторов), утилизационный сбор и сбор за первичную регистрацию.",
          "Мелочи, о которых забывают: страховка на перегон, СВХ, услуги брокера.",
        ],
        p: [
          "Ставки зависят от года выпуска, объёма и типа двигателя, поэтому единой цифры нет. Точный расчёт под конкретную машину делает калькулятор нашего магазина K-Axis — он считает по действующим ставкам РК.",
        ],
      },
      {
        h: "Сроки",
        p: [
          "Типовой цикл: подбор и проверка — от пары дней до двух недель; выкуп и подготовка документов — до недели; доставка до Казахстана — две-четыре недели в зависимости от маршрута; таможенное оформление — от нескольких дней.",
          "Итого разумно закладывать 1,5–2 месяца от решения до машины на учёте.",
        ],
      },
      {
        h: "Главные риски и как их закрыть",
        list: [
          "Скрытые ДТП: закрываются страховым отчётом и протоколом осмотра ДО внесения предоплаты — это и есть наша бесплатная проверка.",
          "Скрученный пробег: сверка по базе техосмотров Кореи.",
          "Недобросовестный посредник: работайте с экспортёром, который показывает договор, инвойсы и даёт видеоотчёт осмотра.",
          "Неправильно посчитанная растаможка: считайте до покупки, а не после прихода машины на границу.",
        ],
      },
      {
        h: "Как выглядит процесс с нами",
        p: [
          "Вы присылаете ссылку на понравившееся объявление — мы бесплатно проверяем историю. Дальше наш магазин K-Axis берёт на себя осмотр, выкуп, документы, доставку и растаможку до вашего города. Запчасти для привезённой машины — там же, с прямой отправкой из Кореи.",
        ],
      },
    ],
    faq: [
      {
        q: "Сколько стоит растаможка авто из Кореи в Казахстан?",
        a: `Зависит от года, объёма и типа двигателя: пошлина + НДС + акциз (если применим) + утильсбор + первичная регистрация. Точный расчёт по действующим ставкам — в калькуляторе K-Axis: ${CALC_URL.split("?")[0]}`,
      },
      {
        q: "Сколько ехать машине из Кореи в Казахстан?",
        a: "В среднем две-четыре недели на доставку плюс оформление. Полный цикл от выбора до учёта — обычно 1,5–2 месяца.",
      },
      {
        q: "Можно ли проверить машину до покупки?",
        a: "Обязательно нужно: пришлите ссылку на объявление в нашу форму — бесплатный мини-отчёт по истории придёт в мессенджер.",
      },
    ],
  },
  en: {
    intro: [
      "Kazakhstan is one of the top destinations for Korean car exports: left-hand drive fits, restrictions are milder, and the price gap on late-model Hyundai, Kia and Genesis remains real.",
      "Here's the full route — from picking a car in Korea to registering it in Kazakhstan — and what the landed price consists of.",
    ],
    sections: [
      {
        h: "What the landed price includes",
        list: [
          "The car's price in Korea (plus marketplace/auction fees).",
          "Exporter services: inspection, purchase, deregistration, export paperwork.",
          "Shipping: carrier or container to the border/port, then to your city.",
          "Kazakhstan customs: duty, VAT, excise (large engines), recycling fee and first registration fee.",
        ],
        p: [
          "Rates depend on the car's year and engine, so there is no single number — the K-Axis calculator computes it per car at current KZ rates.",
        ],
      },
      {
        h: "Timeline",
        p: [
          "Sourcing and checks: days to two weeks; purchase and paperwork: up to a week; shipping to Kazakhstan: two to four weeks; customs: several days. Budget 1.5–2 months end to end.",
        ],
      },
      {
        h: "Key risks",
        list: [
          "Hidden accidents — closed by the insurance report and inspection protocol BEFORE any deposit (that's our free check).",
          "Rolled-back mileage — verified against Korean inspection records.",
          "Bad intermediaries — work with an exporter who shows contracts, invoices and video inspection reports.",
        ],
      },
    ],
    faq: [
      {
        q: "How much is customs clearance to Kazakhstan?",
        a: "It depends on the car's year and engine: duty + VAT + excise (if applicable) + recycling and registration fees. The K-Axis calculator computes it at current rates.",
      },
      {
        q: "How long does delivery take?",
        a: "Two to four weeks of shipping plus paperwork; 1.5–2 months for the full cycle.",
      },
    ],
  },
  ar: {
    intro: [
      "كازاخستان من أهم وجهات تصدير السيارات الكورية، وفارق الأسعار على موديلات هيونداي وكيا وجينيسيس الحديثة ما زال حقيقياً.",
    ],
    sections: [
      {
        h: "مم يتكون السعر النهائي",
        list: [
          "سعر السيارة في كوريا ورسوم المنصة.",
          "خدمات المصدّر: الفحص والشراء والأوراق.",
          "الشحن حتى مدينتك.",
          "جمارك كازاخستان: الرسوم والضريبة ورسوم إعادة التدوير والتسجيل.",
        ],
      },
      {
        h: "المدة",
        p: ["احسب من شهر ونصف إلى شهرين من القرار حتى التسجيل."],
      },
    ],
    faq: [
      {
        q: "هل يمكن فحص السيارة قبل الشراء؟",
        a: "يجب ذلك: أرسل رابط الإعلان عبر نموذجنا — يصلك تقرير مصغر مجاني عن التاريخ.",
      },
    ],
  },
};

export default function Page() {
  const locale = useLocale() as GuideLocale;
  return <GuideLayout slug={SLUG} lang={locale} content={CONTENT[locale]} bannerVariant="calc" />;
}
