import type { Metadata } from "next";
import { useLocale } from "next-intl";
import { GuideLayout, guideMetadata, type GuideContent } from "../GuideLayout";
import type { GuideLocale } from "@/lib/guides";

const SLUG = "kak-kupit-avto-na-encar";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return guideMetadata(SLUG, lang);
}

const CONTENT: Record<GuideLocale, GuideContent> = {
  ru: {
    intro: [
      "Купить машину на Encar из-за границы напрямую нельзя: площадка рассчитана на внутренний рынок Кореи — корейский номер телефона, местная оплата, самовывоз. Но схема покупки через представителя отработана годами и прозрачна, если знать её шаги.",
    ],
    sections: [
      {
        h: "Шаг 1. Выбор и проверка объявления",
        p: [
          "Отбираете 2–3 кандидата и проверяете историю каждого: страховой отчёт, протокол осмотра, пробег по техосмотрам. На этом этапе отсеивается больше половины машин — и это нормально.",
          "Нашу базовую проверку мы делаем бесплатно: пришлите ссылки — вернём мини-отчёты и честно скажем, какой вариант стоит смотреть дальше.",
        ],
      },
      {
        h: "Шаг 2. Живой осмотр",
        p: [
          "Документы показывают историю, но не текущее состояние: подвеску, электрику, следы гаражного ремонта. Представитель в Корее выезжает к продавцу, снимает видео и проверяет машину по чек-листу до внесения любых денег.",
        ],
      },
      {
        h: "Шаг 3. Выкуп и документы",
        p: [
          "После подтверждения представитель договаривается о цене (торг в Корее уместен), подписывает договор, оплачивает машину и оформляет снятие с учёта и экспортные документы. Вы получаете копии договора и инвойса.",
        ],
      },
      {
        h: "Шаг 4. Доставка и растаможка",
        p: [
          "Машина едет автовозом или контейнером до границы или порта, затем — до вашего города. Таможенные платежи считаются заранее, чтобы бюджет не «поплыл» на финише.",
        ],
      },
      {
        h: "Сколько это стоит",
        p: [
          "Итог = цена машины + услуги экспортёра + доставка + растаможка. Первую составляющую вы видите на Encar, остальные три вам обязаны посчитать до сделки. Наш магазин K-Axis даёт расчёт под ключ по конкретному объявлению.",
        ],
      },
    ],
    faq: [
      {
        q: "Можно ли купить на Encar без посредника?",
        a: "Практически нет: нужны корейский номер, местный счёт и физическое присутствие на сделке. Иностранцы покупают через лицензированного экспортёра.",
      },
      {
        q: "Как не нарваться на мошенников?",
        a: "Проверяйте историю машины до предоплаты, требуйте договор и инвойс, видеоотчёт осмотра и не переводите деньги на личные карты.",
      },
      {
        q: "С чего начать?",
        a: "Пришлите ссылку на понравившееся объявление в форму бесплатной проверки — дальше проведём по всем шагам.",
      },
    ],
  },
  en: {
    intro: [
      "You can't buy on Encar directly from abroad: the platform expects a Korean phone number, local payment and in-person pickup. Buying through a representative is the established, transparent route — if you know its steps.",
    ],
    sections: [
      {
        h: "Step 1. Shortlist and verify",
        p: [
          "Pick 2–3 candidates and check each one's history: insurance report, inspection protocol, mileage records. More than half get eliminated here — that's normal. Our basic check is free: send the links, we return mini-reports.",
        ],
      },
      {
        h: "Step 2. Physical inspection",
        p: [
          "Documents show history, not present condition. A representative in Korea visits the seller, films the car and runs a checklist before any money moves.",
        ],
      },
      {
        h: "Step 3. Purchase and paperwork",
        p: [
          "The representative negotiates, signs the contract, pays, deregisters the car and prepares export documents. You receive contract and invoice copies.",
        ],
      },
      {
        h: "Step 4. Shipping and customs",
        p: [
          "Carrier or container to the border/port, then to your city. Customs is calculated before the deal, not after the car reaches the border.",
        ],
      },
    ],
    faq: [
      {
        q: "Can I buy on Encar without an intermediary?",
        a: "Practically no: you need a Korean phone number, a local account and physical presence. Foreigners buy through a licensed exporter.",
      },
      {
        q: "Where do I start?",
        a: "Send the listing link through our free check form — we'll walk you through every step from there.",
      },
    ],
  },
  ar: {
    intro: [
      "لا يمكن الشراء من Encar مباشرة من الخارج: المنصة تتطلب رقماً كورياً ودفعاً محلياً وحضوراً شخصياً. الشراء عبر ممثل هو الطريق المعتمد.",
    ],
    sections: [
      {
        h: "الخطوات",
        list: [
          "اختر مرشحين وافحص تاريخ كل منهما — فحصنا الأساسي مجاني.",
          "معاينة فعلية بالفيديو قبل دفع أي مبلغ.",
          "الشراء والتوقيع وإعداد أوراق التصدير.",
          "الشحن والجمارك المحسوبة مسبقاً.",
        ],
      },
    ],
    faq: [
      {
        q: "من أين أبدأ؟",
        a: "أرسل رابط الإعلان عبر نموذج الفحص المجاني — ونرافقك في كل الخطوات.",
      },
    ],
  },
};

export default function Page() {
  const locale = useLocale() as GuideLocale;
  return <GuideLayout slug={SLUG} lang={locale} content={CONTENT[locale]} />;
}
