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

  return {
    title: titles[lang] ?? t("title"),
    description: descriptions[lang],
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${BASE}/${l}/faq`])),
      canonical: `${BASE}/${lang}/faq`,
    },
  };
}

export default function FaqPage() {
  return <FaqClient />;
}
