import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Container } from "@/components/ui/container";
import { KmotorsBanner } from "@/components/KmotorsBanner";
import { PartsBanner } from "@/components/PartsBanner";
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
    ru: "Частые вопросы о проверке авто из Кореи | Caranalizer",
    en: "FAQ — Korean Car Check | Caranalizer",
    ar: "الأسئلة الشائعة — فحص السيارات الكورية | Caranalizer",
  };
  const descriptions: Record<string, string> = {
    ru: "Ответы на частые вопросы о бесплатной проверке авто из Кореи: какие сайты проверяем, сроки отчёта, покупка и доставка через K-Axis.",
    en: "Answers to common questions about the free Korean car check: covered marketplaces, report timing, purchase and delivery via K-Axis.",
    ar: "إجابات على الأسئلة الشائعة حول الفحص المجاني للسيارات الكورية والشراء والتوصيل عبر K-Axis.",
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
      <section className="pb-16">
        <Container className="max-w-3xl space-y-4">
          <PartsBanner placement="faq" />
          <KmotorsBanner variant="calc" placement="faq" compact />
        </Container>
      </section>
    </>
  );
}
