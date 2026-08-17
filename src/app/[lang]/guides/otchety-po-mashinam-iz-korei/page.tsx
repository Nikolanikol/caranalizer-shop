import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { GuideLayout, guideMetadata, type GuideContent } from "../GuideLayout";
import type { GuideLocale } from "@/lib/guides";

const SLUG = "otchety-po-mashinam-iz-korei";

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
      "«Отчёт по машине из Кореи» — это не один документ, а три разных источника, каждый со своей зоной ответственности. Понимание того, что показывает каждый из них, экономит и деньги, и нервы.",
    ],
    sections: [
      {
        h: "1. Страховой отчёт (보험이력 / Carhistory)",
        p: [
          "Главный документ. Фиксирует каждый страховой случай: дату, роль машины (виновник 내차보험 / пострадавший 상대보험), сумму выплаты в вонах и что ремонтировалось. Также показывает смены владельцев, использование в такси/аренде и факты утопления.",
          "Важно: если ремонт делали без страховой (за наличные), в отчёте его не будет. Поэтому страховой отчёт всегда читают в паре с протоколом осмотра.",
        ],
      },
      {
        h: "2. Протокол осмотра (성능·상태점검기록부)",
        p: [
          "Обязателен для всех машин, продающихся через дилеров. Это схема кузова с пометками: X — замена элемента, W — сварка/ремонт. Отдельные разделы — по двигателю, коробке, утечкам жидкостей и электрике.",
          "Именно здесь видны «безстраховые» ремонты: если крыло менялось, протокол это покажет, даже когда в страховой истории пусто.",
        ],
      },
      {
        h: "3. Аукционный лист",
        p: [
          "Если машина продаётся через аукцион, эксперт площадки присваивает ей балл и составляет карту дефектов. Шкала и обозначения похожи на японские аукционы, но стандарты различаются между площадками — сравнивать баллы «в лоб» нельзя.",
        ],
      },
      {
        h: "Каким цифрам верить",
        list: [
          "Пробег: только по цепочке техосмотров, не по объявлению.",
          "«Без ДТП»: только по паре страховой отчёт + протокол осмотра.",
          "Комплектация: по VIN — что реально стояло с завода, а не что написал продавец.",
          "Цена: сравнивайте с рыночной по той же модели и году на Encar/KBChachacha, а не с ценой одного объявления.",
        ],
      },
    ],
    faq: [
      {
        q: "Какой отчёт заказывать первым?",
        a: "Страховой + протокол осмотра — эта пара закрывает 90% рисков. Наш бесплатный мини-отчёт как раз строится на них.",
      },
      {
        q: "Отчёт гарантирует состояние машины?",
        a: "Нет. Документы показывают историю, но не текущее состояние. Перед выкупом мы рекомендуем живой осмотр — наша команда в Корее его проводит.",
      },
      {
        q: "Сколько стоит полный отчёт?",
        a: "Мини-отчёт — бесплатно. Тарифы полной проверки указаны на странице проверки; они зависят от количества машин.",
      },
    ],
  },
  en: {
    intro: [
      "A 'Korean car report' is not one document but three different sources, each covering its own risk area. Knowing what each one shows saves both money and nerves.",
    ],
    sections: [
      {
        h: "1. Insurance report (보험이력 / Carhistory)",
        p: [
          "The key document: every claim with date, role (at-fault vs victim), payout in KRW and what was repaired; plus owner changes, taxi/rental use and flood records. Cash repairs bypass it — which is why it's always read together with the inspection protocol.",
        ],
      },
      {
        h: "2. Inspection protocol (성능·상태점검기록부)",
        p: [
          "Mandatory for dealer sales: a body diagram marking X for replaced panels and W for welding, plus engine, transmission, leak and electrics sections. This is where cash-paid repairs surface.",
        ],
      },
      {
        h: "3. Auction sheet",
        p: [
          "For auction cars, the platform's inspector assigns a grade and defect map. Scales differ between auction houses, so grades aren't directly comparable.",
        ],
      },
      {
        h: "Which numbers to trust",
        list: [
          "Mileage: only via the inspection-record chain.",
          "'No accidents': only via insurance report + inspection protocol together.",
          "Specs: by VIN, not by the seller's text.",
        ],
      },
    ],
    faq: [
      {
        q: "Which report first?",
        a: "Insurance + inspection protocol — that pair covers 90% of the risk. Our free mini-report is built on them.",
      },
      {
        q: "Does a report guarantee condition?",
        a: "No — documents show history, not present condition. We recommend a physical inspection before purchase; our team in Korea performs it.",
      },
    ],
  },
  ar: {
    intro: [
      "«تقرير السيارة الكورية» ليس مستنداً واحداً بل ثلاثة مصادر مختلفة، لكل منها مجال مسؤوليته.",
    ],
    sections: [
      {
        h: "المصادر الثلاثة",
        list: [
          "تقرير التأمين: كل مطالبة بتاريخها ودورها ومبلغها، وتغييرات الملكية والاستخدام كأجرة.",
          "بروتوكول الفحص الإلزامي: مخطط الهيكل بعلامات الاستبدال واللحام وحالة الأجزاء.",
          "ورقة المزاد: درجة وخريطة عيوب من فاحص المنصة.",
        ],
      },
      {
        h: "بأي أرقام تثق",
        list: [
          "المسافة: عبر سلسلة سجلات الفحص فقط.",
          "«بدون حوادث»: عبر تقرير التأمين وبروتوكول الفحص معاً.",
        ],
      },
    ],
    faq: [
      {
        q: "هل يضمن التقرير حالة السيارة؟",
        a: "لا — المستندات تظهر التاريخ لا الحالة الحالية. ننصح بمعاينة فعلية قبل الشراء، وفريقنا في كوريا يقوم بها.",
      },
    ],
  },
};

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  // Язык берём из адреса и сообщаем next-intl: `useLocale` внутри GuideLayout
  // иначе читает заголовки запроса, и статики у гайда не будет.
  const { lang } = (await params) as { lang: GuideLocale };
  setRequestLocale(lang);
  return <GuideLayout slug={SLUG} lang={lang} content={CONTENT[lang]} showReportCta />;
}
