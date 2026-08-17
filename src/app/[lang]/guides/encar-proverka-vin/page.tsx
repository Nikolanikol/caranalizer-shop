import type { Metadata } from "next";
import { GuideLayout, guideMetadata, type GuideContent } from "../GuideLayout";
import type { GuideLocale } from "@/lib/guides";
import { setRequestLocale } from "next-intl/server";

const SLUG = "encar-proverka-vin";

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
      "Encar (encar.com) — крупнейшая площадка б/у автомобилей Кореи. По каждому объявлению доступно больше данных, чем кажется: страховая история, диагностика, статус залогов. Проблема в том, что всё это на корейском и частично за платной стеной.",
      "Разбираем, где в объявлении Encar искать историю автомобиля, что можно узнать по VIN и какие данные без корейского счёта не достать.",
    ],
    sections: [
      {
        h: "Номер объявления и VIN — не одно и то же",
        p: [
          "У каждого объявления Encar есть номер (차량번호 в URL вида encar.com/dc/dc_cardetailview.do?...carid=...). По нему машину найдём мы или любой экспортёр. VIN (차대번호) продавец показывает не всегда — часто он открывается только по запросу или виден в отчёте диагностики.",
          "Если у вас есть только VIN без ссылки — проверить историю тоже можно: страховые базы Кореи работают именно по VIN.",
        ],
      },
      {
        h: "Что открыто в объявлении бесплатно",
        list: [
          "보험이력 (страховая история) — количество страховых случаев, роль (виновник/пострадавший) и суммы выплат в вонах. Часть данных Encar показывает после регистрации.",
          "성능·상태점검기록부 (протокол диагностики) — обязателен для дилерских машин: замены и сварка панелей, утечки, состояние двигателя и коробки.",
          "압류/저당 (аресты и залоги) — есть ли на машине обременения.",
          "주행거리 (пробег) — сверяется с базой техосмотров; расхождение = скрученный одометр.",
        ],
      },
      {
        h: "Encar Diagnosis и «Encar Home Service»",
        p: [
          "Часть машин продаётся с расширенной диагностикой Encar (엔카진단) — выездной осмотр специалистом площадки с фотофиксацией. Такие объявления надёжнее, но их меньше и они дороже.",
          "Для остальных машин единственный способ убедиться в состоянии — заказать независимый осмотр на месте. Наша команда в Корее делает это перед выкупом.",
        ],
      },
      {
        h: "Чего не видно без корейского счёта",
        p: [
          "Полные страховые отчёты (Carhistory) — платные и требуют корейской авторизации. Именно поэтому «проверка по фото» из-за границы не работает: ключевые данные лежат в закрытых базах.",
          "Мы вытаскиваем эти отчёты в рамках проверки: бесплатный мини-отчёт покрывает основное, полный платный — все страховые детали построчно.",
        ],
      },
    ],
    faq: [
      {
        q: "Можно ли проверить машину на Encar только по VIN?",
        a: "Да. Страховая история и статус обременений в Корее привязаны к VIN. Пришлите VIN в форму проверки — остальное сделаем мы.",
      },
      {
        q: "Encar показывает реальный пробег?",
        a: "Пробег в объявлении заявляет продавец, но он сверяется с базой обязательных техосмотров. В мини-отчёте мы отмечаем расхождения.",
      },
      {
        q: "Что делать, если машина понравилась?",
        a: "Сначала — бесплатная проверка истории. Если всё чисто, наш магазин K-Axis организует осмотр, выкуп и доставку.",
      },
    ],
  },
  en: {
    intro: [
      "Encar (encar.com) is Korea's biggest used-car marketplace. Every listing carries more data than meets the eye: insurance history, inspection, lien status — but it's in Korean and partly paywalled.",
      "Here's where the history hides in an Encar listing, what a VIN alone reveals, and what you can't reach without a Korean account.",
    ],
    sections: [
      {
        h: "Listing number vs VIN",
        p: [
          "Each listing has a car id in its URL; the VIN (차대번호) is often shown only on request or inside the inspection report. If all you have is a VIN, the history can still be pulled — Korean insurance databases key off the VIN.",
        ],
      },
      {
        h: "What's free in a listing",
        list: [
          "보험이력 — insurance history: number of claims, at-fault vs victim, payout amounts in KRW.",
          "성능·상태점검기록부 — mandatory dealer inspection: replaced/welded panels, leaks, engine and transmission condition.",
          "압류/저당 — liens and seizures on the car.",
          "주행거리 — mileage, cross-checked against inspection records.",
        ],
      },
      {
        h: "What you can't see from abroad",
        p: [
          "Full Carhistory insurance reports are paid and require Korean authentication — which is why 'checking by photos' doesn't work. Our free mini-report covers the essentials; the paid full report lists every insurance line.",
        ],
      },
    ],
    faq: [
      {
        q: "Can a car be checked by VIN alone?",
        a: "Yes — Korean insurance history and lien status are keyed to the VIN. Send it through our check form.",
      },
      {
        q: "Is the listed mileage real?",
        a: "It's seller-declared but verifiable against mandatory inspection records; our mini-report flags mismatches.",
      },
    ],
  },
  ar: {
    intro: [
      "Encar هو أكبر سوق للسيارات المستعملة في كوريا. كل إعلان يحمل بيانات أكثر مما يبدو: سجل التأمين والفحص والرهون — لكنها بالكورية وبعضها مدفوع.",
    ],
    sections: [
      {
        h: "ما المتاح مجاناً في الإعلان",
        list: [
          "سجل التأمين: عدد المطالبات والأدوار والمبالغ.",
          "بروتوكول الفحص الإلزامي: الألواح المستبدلة أو الملحومة وحالة المحرك.",
          "الرهون والحجوزات على السيارة.",
        ],
      },
      {
        h: "ما لا يمكن رؤيته من الخارج",
        p: [
          "تقارير التأمين الكاملة مدفوعة وتتطلب حساباً كورياً. تقريرنا المصغر المجاني يغطي الأساسيات، والتقرير الكامل يعرض كل التفاصيل.",
        ],
      },
    ],
    faq: [
      {
        q: "هل يمكن فحص السيارة برقم VIN فقط؟",
        a: "نعم — سجل التأمين الكوري مرتبط بـ VIN. أرسله عبر نموذج الفحص.",
      },
    ],
  },
};

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  // Язык берём из адреса и сообщаем next-intl: `useLocale` внутри GuideLayout
  // иначе читает заголовки запроса, и статики у гайдов не будет.
  const { lang } = (await params) as { lang: GuideLocale };
  setRequestLocale(lang);
  return <GuideLayout slug={SLUG} lang={lang} content={CONTENT[lang]} />;
}
