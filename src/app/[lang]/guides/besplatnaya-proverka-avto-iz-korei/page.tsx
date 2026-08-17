import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { setRequestLocale } from "next-intl/server";
import { GuideLayout, guideMetadata, type GuideContent } from "../GuideLayout";
import { CheckLeadForm } from "../../proverka-avto-po-vin/CheckLeadForm";
import type { GuideLocale } from "@/lib/guides";

const SLUG = "besplatnaya-proverka-avto-iz-korei";

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
      "Проверить корейское авто перед покупкой можно бесплатно — если знать, где лежат открытые данные и что они на самом деле показывают. Разбираем все бесплатные способы и их пределы.",
    ],
    sections: [
      {
        h: "Что можно узнать бесплатно самостоятельно",
        list: [
          "Страховая сводка в объявлении Encar / KBChachacha: количество страховых случаев и суммы выплат (после регистрации на площадке).",
          "Протокол осмотра дилерской машины: замены и сварка панелей — публикуется вместе с объявлением.",
          "Историю модели: типовые болячки поколения ищутся по корейским форумам и клубам.",
          "Курс воны и порядок цен: сравнение одинаковых комплектаций на двух площадках сразу показывает завышенную цену.",
        ],
      },
      {
        h: "Пределы бесплатных данных",
        p: [
          "Полная страховая история (построчно, с датами и деталями ремонтов) — платная и требует корейской авторизации. Сведения об обременениях и такси-прошлом тоже глубже, чем сводка в объявлении.",
          "Автоперевод браузера регулярно путает «виновника» и «пострадавшего», «замену» и «ремонт» — а это принципиально разные вещи для цены машины.",
        ],
      },
      {
        h: "Наш бесплатный мини-отчёт",
        p: [
          "Мы делаем базовую проверку бесплатно: история ДТП и выплат, реальный пробег по базе техосмотров, заводская комплектация по VIN и явные красные флаги (утопление, такси, залог).",
          "Отчёт приходит в WhatsApp или Telegram в течение рабочего дня. Форма — прямо под этой статьёй.",
        ],
      },
      {
        h: "Когда нужна платная проверка",
        p: [
          "Если машина прошла мини-отчёт чисто и вы всерьёз готовы её брать — есть смысл заказать полный отчёт со всеми страховыми строками и осмотр на месте. Это дешевле, чем привезти машину с сюрпризом.",
        ],
      },
    ],
    faq: [
      {
        q: "В чём подвох бесплатной проверки?",
        a: "Подвоха нет: мини-отчёт — это наш способ познакомиться. Зарабатываем мы на полных проверках, подборе и доставке авто и запчастей через K-Axis.",
      },
      {
        q: "Какие сайты вы проверяете?",
        a: "Encar, KBChachacha, Kcar — а также любую корейскую машину по VIN.",
      },
      {
        q: "Сколько ждать отчёт?",
        a: "Обычно несколько часов, максимум один рабочий день.",
      },
    ],
  },
  en: {
    intro: [
      "You can check a Korean car for free before buying — if you know where the open data lives and what it actually proves. Here are all the free routes and their limits.",
    ],
    sections: [
      {
        h: "What's free to check yourself",
        list: [
          "The insurance summary in an Encar / KBChachacha listing: claim count and payout totals.",
          "The dealer inspection protocol: replaced and welded panels, published with the listing.",
          "Model-generation weak spots via Korean owner forums.",
        ],
      },
      {
        h: "Where free data ends",
        p: [
          "The full line-by-line insurance history is paid and needs Korean authentication. Browser auto-translation also routinely confuses at-fault with victim and replacement with repair — which changes the car's value entirely.",
        ],
      },
      {
        h: "Our free mini-report",
        p: [
          "We run the basic check for free: accident and payout history, real mileage from inspection records, factory specs by VIN and red flags (flood, taxi, lien). The report arrives in WhatsApp or Telegram within a business day — the form is right below this article.",
        ],
      },
    ],
    faq: [
      {
        q: "What's the catch?",
        a: "None — the mini-report is how we earn your trust. Our revenue comes from full checks, sourcing and delivery via K-Axis.",
      },
      {
        q: "Which sites do you cover?",
        a: "Encar, KBChachacha, Kcar — or any Korean car by VIN.",
      },
    ],
  },
  ar: {
    intro: [
      "يمكنك فحص سيارة كورية مجاناً قبل الشراء — إذا عرفت أين توجد البيانات المفتوحة وما تثبته فعلاً.",
    ],
    sections: [
      {
        h: "ما يمكن فحصه مجاناً",
        list: [
          "ملخص التأمين في إعلان Encar / KBChachacha.",
          "بروتوكول فحص سيارات الوكلاء: الألواح المستبدلة والملحومة.",
        ],
      },
      {
        h: "تقريرنا المصغر المجاني",
        p: [
          "نجري الفحص الأساسي مجاناً: تاريخ الحوادث والمدفوعات، والمسافة الحقيقية، والمواصفات حسب VIN، والأعلام الحمراء. يصل التقرير عبر واتساب أو تيليجرام خلال يوم عمل — النموذج أسفل هذه المقالة.",
        ],
      },
    ],
    faq: [
      {
        q: "ما المقابل؟",
        a: "لا شيء — التقرير المصغر طريقتنا لكسب ثقتك. دخلنا من الفحوصات الكاملة والشراء والتوصيل عبر K-Axis.",
      },
    ],
  },
};

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  // Тело в синхронном компоненте: хуки в асинхронном серверном вызывать нельзя,
  // а setRequestLocale нужен до них — иначе страница уходит в динамику.
  const { lang } = (await params) as { lang: GuideLocale };
  setRequestLocale(lang);
  return <GuideContent locale={lang} />;
}

function GuideContent({ locale }: { locale: GuideLocale }) {
  const t = useTranslations("check");

  return (
    <>
      <GuideLayout slug={SLUG} lang={locale} content={CONTENT[locale]} />
      {/* Форма прямо на странице — этот запрос («бесплатно проверить») самый горячий */}
      <section id="free-check" className="pb-20 scroll-mt-16">
        <Container className="max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] mb-3">
              {t("formTitle")}
            </h2>
            <p className="text-text-secondary">{t("formSub")}</p>
          </div>
          <CheckLeadForm />
        </Container>
      </section>
    </>
  );
}
