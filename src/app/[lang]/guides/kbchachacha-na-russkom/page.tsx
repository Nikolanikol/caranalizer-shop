import type { Metadata } from "next";
import { useLocale } from "next-intl";
import { GuideLayout, guideMetadata, type GuideContent } from "../GuideLayout";
import type { GuideLocale } from "@/lib/guides";

const SLUG = "kbchachacha-na-russkom";

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
      "KBChachacha (kbchachacha.com) — одна из крупнейших площадок б/у автомобилей в Южной Корее, принадлежит банковской группе KB. Здесь дилеры и частники выставляют сотни тысяч машин, но весь интерфейс — на корейском, и автоперевод браузера часто искажает ключевые пометки.",
      "В этом гайде разбираем, как искать автомобили на KBChachacha, что означают корейские обозначения в объявлении и на что смотреть, чтобы не привезти проблемную машину.",
    ],
    sections: [
      {
        h: "Как устроен поиск",
        p: [
          "Главный фильтр — марка и модель (제조사 / 모델). Далее: год выпуска (연식), пробег (주행거리), тип топлива (연료), регион продажи (지역) и цена в вонах (가격). Цены указываются в 만원 — «ман вон», то есть десятках тысяч вон: пометка 1,500만원 означает 15 000 000 KRW.",
          "Удобно сортировать по дате публикации: свежие объявления с адекватной ценой уходят за считанные дни.",
        ],
      },
      {
        h: "Что значат пометки в объявлении",
        list: [
          "무사고 — «без ДТП» со слов продавца. Это не гарантия: проверяйте страховую историю.",
          "완전무사고 — «полностью без ДТП», включая мелкие окрасы. Тоже требует проверки.",
          "단순교환 — «простая замена» кузовного элемента (крыло, капот). В Корее это не считается аварийным случаем, но для перепродажи у нас — важный факт.",
          "침수 — утопленник. От таких машин стоит отказываться сразу.",
          "리스/렌트 — машина была в лизинге или аренде (такси, каршеринг): интенсивная эксплуатация.",
        ],
      },
      {
        h: "Какие документы доступны по машине",
        p: [
          "У большинства объявлений есть две ключевые вкладки: страховая история (보험이력) — все зафиксированные страховые случаи с суммами выплат, и протокол осмотра (성능·상태점검기록부) — обязательный для дилерских машин документ, где отмечены замены и сварка кузовных элементов, состояние агрегатов и утечки.",
          "Именно эти два документа, а не фотографии, отвечают на вопрос «бита ли машина». Мы расшифровываем их на русский в рамках бесплатной проверки.",
        ],
      },
      {
        h: "Типичные ошибки покупателей",
        list: [
          "Верить пометке 무사고 без страхового отчёта — до трети таких машин имеют выплаты в истории.",
          "Смотреть только на пробег: корректность одометра подтверждается историей техосмотров, а не цифрой в объявлении.",
          "Игнорировать регион: машины из приморских городов чаще имеют коррозию.",
          "Переводить продавцу предоплату напрямую — сделки для иностранцев проводят через лицензированного экспортёра.",
        ],
      },
    ],
    faq: [
      {
        q: "Можно ли пользоваться KBChachacha без знания корейского?",
        a: "Базовый поиск — да, через автоперевод браузера. Но страховые отчёты и протоколы осмотра автоперевод искажает: ключевые термины (замена, сварка, выплата) требуют точной расшифровки.",
      },
      {
        q: "Чем KBChachacha отличается от Encar?",
        a: "Encar крупнее и принадлежит SK-группе, KBChachacha — банку KB. Ассортимент пересекается, но часть машин выставляется только на одной из площадок, поэтому искать стоит на обеих.",
      },
      {
        q: "Как проверить конкретное объявление с KBChachacha?",
        a: "Пришлите ссылку через форму бесплатной проверки — вернём мини-отчёт по истории ДТП, выплатам и пробегу на русском.",
      },
    ],
  },
  en: {
    intro: [
      "KBChachacha (kbchachacha.com) is one of South Korea's largest used-car marketplaces, owned by the KB banking group. Hundreds of thousands of cars are listed, but the interface is Korean-only and browser auto-translation often mangles the labels that matter.",
      "This guide covers how search works, what the Korean labels in a listing mean, and what to verify before importing a car.",
    ],
    sections: [
      {
        h: "How search works",
        p: [
          "Filter by make and model (제조사 / 모델), then year (연식), mileage (주행거리), fuel (연료), region (지역) and price (가격). Prices are shown in 만원 — units of 10,000 KRW: a 1,500만원 tag means 15,000,000 KRW.",
        ],
      },
      {
        h: "Labels you must understand",
        list: [
          "무사고 — 'no accidents' according to the seller. Always verify against the insurance history.",
          "단순교환 — 'simple replacement' of a body panel. Not counted as accident damage in Korea, but it matters for resale.",
          "침수 — flood-damaged car. Walk away.",
          "리스/렌트 — former lease or rental (taxi, car-sharing): heavy use.",
        ],
      },
      {
        h: "The two documents that matter",
        p: [
          "Most listings expose the insurance history (보험이력) — every recorded claim with payout amounts — and the mandatory dealer inspection protocol (성능·상태점검기록부) showing replaced or welded panels and the condition of major units.",
          "These documents, not the photos, answer whether the car was crashed. Our free check decodes them into plain language.",
        ],
      },
    ],
    faq: [
      {
        q: "Can I use KBChachacha without Korean?",
        a: "Basic search — yes, via browser translation. But insurance reports and inspection protocols need precise decoding of terms like replacement, welding and payout.",
      },
      {
        q: "How do I verify a specific listing?",
        a: "Send the link through our free check form — we'll return a mini-report on accidents, payouts and mileage.",
      },
    ],
  },
  ar: {
    intro: [
      "KBChachacha هو أحد أكبر أسواق السيارات المستعملة في كوريا الجنوبية، مملوك لمجموعة KB المصرفية. الواجهة بالكورية فقط، والترجمة الآلية كثيراً ما تشوه العلامات المهمة.",
    ],
    sections: [
      {
        h: "أهم العلامات في الإعلان",
        list: [
          "무사고 — «بدون حوادث» حسب البائع. تحقق دائماً من سجل التأمين.",
          "단순교환 — استبدال بسيط للوحة هيكل. مهم عند إعادة البيع.",
          "침수 — سيارة غارقة. ابتعد عنها.",
        ],
      },
      {
        h: "المستندان الأهم",
        p: [
          "سجل التأمين (보험이력) يعرض كل مطالبة بمبالغها، وبروتوكول الفحص (성능·상태점검기록부) يبين الألواح المستبدلة أو الملحومة وحالة الأجزاء الرئيسية. فحصنا المجاني يفك هذه المستندات بلغة واضحة.",
        ],
      },
    ],
    faq: [
      {
        q: "كيف أتحقق من إعلان معين؟",
        a: "أرسل الرابط عبر نموذج الفحص المجاني — نعيد لك تقريراً مصغراً عن الحوادث والمدفوعات والمسافة.",
      },
    ],
  },
};

export default function Page() {
  const locale = useLocale() as GuideLocale;
  return <GuideLayout slug={SLUG} lang={locale} content={CONTENT[locale]} />;
}
