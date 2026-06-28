import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { FaqClient } from "./FaqClient";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://caranalizer.com";
const LOCALES = ["ru", "en", "ar"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang as Locale, namespace: "faq" });

  const titles: Record<string, string> = {
    ru: "Часто задаваемые вопросы о запчастях из Кореи | Caranalizer",
    en: "FAQ — Korean Car Parts & Shipping | Caranalizer",
    ar: "الأسئلة الشائعة — قطع غيار السيارات الكورية | Caranalizer",
  };
  const descriptions: Record<string, string> = {
    ru: "Ответы на частые вопросы о доставке, оригинальности и оплате запчастей Hyundai, Kia, Genesis из Кореи.",
    en: "Answers to common questions about shipping, authenticity, and payment for Hyundai, Kia, Genesis parts from Korea.",
    ar: "إجابات على الأسئلة الشائعة حول الشحن والأصالة والدفع لقطع غيار هيونداي وكيا وجينيسيس من كوريا.",
  };

  const title = titles[lang] ?? t("title");
  const description = descriptions[lang];

  return {
    title,
    description,
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${BASE}/${l}/faq`])),
      canonical: `${BASE}/${lang}/faq`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE}/${lang}/faq`,
    },
  };
}

const FAQ_KEYS = [
  { q: "q1", a: "a1" },
  { q: "q2", a: "a2" },
  { q: "q3", a: "a3" },
  { q: "q4", a: "a4" },
  { q: "q5", a: "a5" },
];

export default async function FaqPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang as Locale, namespace: "faq" });

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_KEYS.map(({ q, a }) => ({
      "@type": "Question",
      name: t(q),
      acceptedAnswer: { "@type": "Answer", text: t(a) },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <FaqClient />
    </>
  );
}
