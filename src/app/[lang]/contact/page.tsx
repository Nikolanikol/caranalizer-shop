import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { ContactClient } from "./ContactClient";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://caranalizer.com";
const LOCALES = ["ru", "en", "ar"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang as Locale, namespace: "contact" });

  const titles: Record<string, string> = {
    ru: "Связаться с нами — заказ запчастей из Кореи | Caranalizer",
    en: "Contact Us — Order Korean Car Parts | Caranalizer",
    ar: "اتصل بنا — طلب قطع غيار السيارات الكورية | Caranalizer",
  };
  const descriptions: Record<string, string> = {
    ru: "Свяжитесь с нами для заказа оригинальных запчастей Hyundai, Kia, Genesis из Кореи. Быстрый ответ, помощь в подборе деталей.",
    en: "Contact us to order genuine Hyundai, Kia, Genesis parts from Korea. Fast response, expert help finding the right part.",
    ar: "تواصل معنا لطلب قطع غيار هيونداي وكيا وجينيسيس الأصلية من كوريا. رد سريع ومساعدة في اختيار القطعة المناسبة.",
  };

  return {
    title: titles[lang] ?? t("title"),
    description: descriptions[lang],
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${BASE}/${l}/contact`])),
      canonical: `${BASE}/${lang}/contact`,
    },
  };
}

export default function ContactPage() {
  return <ContactClient />;
}
